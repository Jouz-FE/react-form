import React, { Dispatch, RefObject, SetStateAction } from "react";

import type { ItemPathType, ValueType } from "./createFormService";
import useFormItem, { ItemRuleType, ValuePropNameType } from "./useFormItem";

export interface FormItemProps {
  name: string | ItemPathType;
  defaultValue?: ValueType;
  valuePropName?: ValuePropNameType;
  makeErrorProps?: (errors: string[]) => Record<string, unknown>;
  rules?: ItemRuleType;
  validate?: (value: ValueType) => string[];
  children:
    | React.ReactNode
    | ((props: {
        formProps: {
          setValue: Dispatch<SetStateAction<any>>;
          setErrors: Dispatch<SetStateAction<string[]>>;
        };
        inputProps: {
          ref: RefObject<any>;
          onBlur: React.FocusEventHandler;
          onChange: React.ChangeEventHandler;
          value?: any;
          checked?: boolean;
        };
        errorProps: Record<string, any>;
      }) => React.ReactNode);
}

const FormItem: React.FC<FormItemProps> = ({
  name,
  rules,
  children,
  validate,
  makeErrorProps,
  defaultValue,
  valuePropName = "value",
}: FormItemProps) => {
  const {
    value,
    errorProps,
    ref,
    onChange,
    onBlur,
    setValue,
    setErrors,
  } = useFormItem({
    name,
    rules,
    validate,
    defaultValue,
    valuePropName,
    makeErrorProps,
  });

  if (isFunction(children)) {
    return (
      <>
        {children({
          formProps: {
            setValue,
            setErrors,
          },
          errorProps,
          inputProps: {
            ref,
            onBlur,
            onChange,
            [valuePropName]: value,
          },
        })}
      </>
    );
  }

  if (React.Children.count(children) > 1) {
    console.warn(
      "[REACT-FORM Wanring] FormItem accepts only one child. other children will be dropped"
    );
  }

  const childrenWithProps = React.Children.map(children, (child, index) => {
    if (index > 0) return null;

    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        ref,
        onBlur,
        onChange,
        [valuePropName]: value,
        ...errorProps,
      });
    }

    return child;
  });

  return <>{childrenWithProps}</>;
};

type IsFunction<T> = T extends (...args: any[]) => unknown ? T : never;
const isFunction = <T extends unknown>(value: T): value is IsFunction<T> =>
  typeof value === "function";

export default FormItem;
