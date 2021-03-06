import _get from "lodash.get";
import _set from "lodash.set";
import _unset from "lodash.unset";
import React, { ReactText, SetStateAction } from "react";

export type ValueType =
  | ReactText
  | boolean
  | Record<string, any>
  | undefined
  | null
  | ValueType[];

export type ItemPathType = [string, ...ReactText[]];

export type StoreValueType = {
  value?: ValueType;
  errors?: string[];
  defaultValue?: ValueType;
  setValue?: (value: ValueType) => void;
  setErrors?: (errors: string[]) => void;
  validate?: () => boolean;
  instance?: HTMLElement;
};

export interface FormServiceProps {
  onSubmit?: (values: Record<string, ValueType>) => void;
  initialValues?: Record<string, ValueType>;
}

class FormService {
  private store: Record<
    string,
    StoreValueType | Record<string, StoreValueType>
  >;

  private registeredItemPaths: ItemPathType[];
  private onSubmit: FormServiceProps["onSubmit"];
  private initialValues: FormServiceProps["initialValues"];
  private subscriptions: Record<string, any>;

  constructor({ onSubmit, initialValues = {} }: FormServiceProps) {
    this.store = {};
    this.onSubmit = onSubmit;
    this.registeredItemPaths = [];
    this.subscriptions = {};
    this.initialValues = initialValues;
  }

  submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const { registeredItemPaths, onSubmit, getItemValue, validateForm } = this;

    this.resetErrors();
    const values = registeredItemPaths.reduce((result, itemPath) => {
      _set(result, itemPath, getItemValue(itemPath));

      return result;
    }, {});

    const isFormValid = validateForm();
    if (!isFormValid) return;
    onSubmit && onSubmit(values);
  };

  reset = (e?: React.FormEvent) => {
    e?.preventDefault();
    const { registeredItemPaths, setItemValue, getItemValue } = this;

    registeredItemPaths.forEach((itemPath) => {
      const current = getItemValue(itemPath);
      const initial = this.getItemInitialValue(itemPath);
      if (current === initial) return;
      setItemValue(itemPath, initial);
    });

    this.resetErrors();
  };

  resetErrors = () => {
    const { registeredItemPaths } = this;
    registeredItemPaths.forEach((itemPath) => {
      const current = this.getItemErrors(itemPath);

      if (current.length > 0) {
        this.setItemError(itemPath, []);
      }
    });
  };

  validateForm = () => {
    const { store, registeredItemPaths } = this;
    let isValid = true;
    registeredItemPaths.forEach((itemPath) => {
      const current = this.getItemValue(itemPath);
      const validateItem = _get(store, [...itemPath, "current", "validate"]);
      const result = validateItem(current);
      if (!result && isValid) isValid = false;
    });

    return isValid;
  };

  getItemValue = (itemPath: ItemPathType) => {
    const { store } = this;

    return _get(store, [...itemPath, "current", "value"]);
  };

  setItemValue = (itemPath: ItemPathType, value: ValueType) => {
    const { store } = this;

    const setValue = _get(store, [...itemPath, "current", "setValue"]);
    setValue(value);
  };

  getItemErrors = (itemPath: ItemPathType) => {
    const { store } = this;

    return _get(store, [...itemPath, "current", "errors"]);
  };

  setItemError = (itemPath: ItemPathType, errors: string[]) => {
    const { store } = this;
    const setErrors = _get(store, [...itemPath, "current", "setErrors"]);
    setErrors(errors);
  };

  getItemInitialValue = (name: string | ItemPathType) => {
    const { store, initialValues } = this;

    const itemPath = typeof name === "string" ? [name] : name;
    const defaultValue = _get(store, [...itemPath, "current", "defaultValue"]);

    return _get(initialValues, name) || defaultValue;
  };

  subscribe = (
    name: string | ItemPathType,
    func: SetStateAction<ValueType>
  ) => {
    const { subscriptions } = this;

    const current = _get(subscriptions, name) || [];
    _set(subscriptions, name, [...current, func]);
  };

  observe = (name: string | ItemPathType, value: ValueType) => {
    const subscriptions = _get(this.subscriptions, name) || [];
    subscriptions.forEach((action: SetStateAction<any>) => action(value));
  };

  createOrGetItemRef = (name: string | ItemPathType) => {
    const { store, registeredItemPaths } = this;

    const savedRef = _get(store, name);
    if (savedRef) return savedRef;

    registeredItemPaths.push(typeof name === "string" ? [name] : name);
    const newRef = React.createRef<StoreValueType>();
    _set(store, name, newRef);

    return newRef;
  };

  removeItemRef = (name: string | ItemPathType) => {
    this.registeredItemPaths = this.registeredItemPaths.filter(
      (itemPath) =>
        itemPath.join() !== (typeof name === "string" ? name : name.join())
    );
    _unset(this.store, name);
  };
}

export default (props: FormServiceProps) => new FormService(props);
