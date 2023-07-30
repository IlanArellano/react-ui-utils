import React, {
  createContext,
  PropsWithChildren,
  PureComponent,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ItemManager } from "@utils/types/validation";
import { ControlForm, ControlView } from "./controlView";
import { EventHandler, getEventId } from "@utils/common/classes/EventHandler";
import { ValueHandler } from "@utils/common/classes/ValueHandler";
import { ChangeValueFromObject } from "@utils/common";

type ValidationPredicate<IValue> = (value: IValue) => boolean;

export type Validation<T> = {
  [K in keyof T]?: T[K] extends object
    ? Validation<T>
    : ValidationPredicate<T[K]>;
};

interface FormValueState<T> {
  value: T | undefined;
  isValidated: ValidationResolve<T>;
}

interface FormValueStateResolved<T> {
  value: T | undefined;
  isValidated: boolean | undefined;
}

export type ValidationResolve<T> = {
  [K in keyof T]?: T[K] extends object ? ValidationResolve<T> : boolean;
};

interface FormContext<T = any> {
  value: T | undefined;
  validation?: Validation<T>;
  validationResolved: ValidationResolve<T>;
  onChange:
    | (<Key extends keyof T>(field: Key, value: T[Key]) => void)
    | undefined;
  itemManager: ItemManager<FormValueState<T>, "change">;
}

export type FormProps<T, TProps extends { [k: string]: any }> = {
  render?: React.ComponentType<TProps>;
  ref?: React.Ref<any>;
  onSubmit?: (result: T) => void;
} & (Partial<Pick<TProps, "value">> &
  Pick<TProps, Exclude<keyof TProps, "value" | "onChange" | "onSubmit">> & {
    onChange?: TProps["onChange"] | null;
  });

export type FieldProps<TProps extends { [k: string]: any }, T> = {
  render?: React.ComponentType<TProps>;
  field: keyof T;
  ref?: React.Ref<any>;
} & (Partial<Pick<TProps, "value">> &
  Pick<TProps, Exclude<keyof TProps, "value" | "onChange">> & {
    onChange?: TProps["onChange"] | null;
  });

const EvalValidation = <T, Key extends keyof T>(
  value: T[Key],
  key: Key,
  validation: Validation<T>
): ValidationResolve<T> => {
  const validationPredicate = validation[key];
  let result: ValidationResolve<T> = {};
  if (validationPredicate instanceof Function)
    result = {
      [key]: validationPredicate(value),
    } as ValidationResolve<T>;
  if (
    validationPredicate &&
    typeof validationPredicate === "object" &&
    !Array.isArray(validationPredicate)
  )
    result = EvalValidation(value, key, validationPredicate as Validation<T>);

  return result;
};

const CheckValidation = <T,>(
  validationResolved: ValidationResolve<T>
): boolean =>
  Object.keys(validationResolved).some((x) => {
    const v = validationResolved[x as keyof T];
    if (v && typeof v === "object" && !Array.isArray(v))
      return CheckValidation(v as ValidationResolve<T>);
    return v === true;
  });

/**
 *
 * ```ts
 * // run typedoc --help for a list of supported languages
 * const instance = new MyClass();
 * ```
 * @param initial
 * @param validation
 * @returns
 */
export function createFormManager<T extends { [key: string]: any }>(
  initial: T,
  validation?: Validation<T>
) {
  if (!initial) throw new Error("initial form value not provided");
  if (typeof initial !== "object")
    throw new Error(
      "initial value allows only a non primitive values and common objects"
    );
  const _event = new EventHandler<FormValueState<T>>();
  const _field_register = new ValueHandler<(keyof T)[]>([]);
  const initialFormCtx: FormContext<T> = {
    value: initial,
    itemManager: {
      addEventListenner: (event, fn) => {
        const id = getEventId(event);
        _event.setSelectedId(id);
        _event.suscribe((value) => fn(value as FormValueState<T>), id);
      },
      removeEventListenner: (event) => {
        const id = getEventId(event);
        _event.clear(id);
      },
    },
    onChange: undefined,
    validation,
    validationResolved: {},
  };

  const FormCxt = createContext<FormContext<T>>(
    initialFormCtx as FormContext<T>
  );

  class Form<
    TProps extends {
      [k: string]: any;
    } = React.FormHTMLAttributes<HTMLFormElement>
  > extends PureComponent<
    FormProps<T, TProps>,
    { value: T; validationResolved: ValidationResolve<T> }
  > {
    constructor(props: FormProps<T, TProps>) {
      super(props);
      this.state = {
        value: initial,
        validationResolved: validation
          ? ChangeValueFromObject(validation as T, false, true)
          : {},
      };
    }

    handleChange = <Key extends keyof T>(field: Key, value: T[Key]) => {
      const newValue = { ...this.state.value, [field]: value };
      const validationPredicate: ValidationResolve<T> = validation
        ? EvalValidation(value, field, validation)
        : {};
      this.setState((prev) => ({
        ...prev,
        value: newValue,
        validationResolved: {
          ...prev.validationResolved,
          ...validationPredicate,
        },
      }));
      const id = getEventId("change");
      _event.setSelectedId(id);
      _event.listen({
        value: newValue,
        isValidated: validationPredicate,
      });
    };

    handleSubmit = (ev: any) => {
      if (ev.preventDefault) ev.preventDefault();
      if (validation && !CheckValidation(this.state.validationResolved)) return;
      if (this.props.onSubmit) this.props.onSubmit(this.state.value);
    };

    render() {
      const { value, validationResolved } = this.state;
      return (
        <FormCxt.Provider
          value={{
            ...initialFormCtx,
            value,
            onChange: this.handleChange.bind(this),
            validationResolved,
          }}
        >
          <ControlForm
            {...this.props}
            value={value}
            onSubmit={this.handleSubmit.bind(this)}
          />
        </FormCxt.Provider>
      );
    }
  }

  function Submit({ children }: PropsWithChildren) {
    const formCtx = useContext(FormCxt);

    const _eval = useMemo(
      () => CheckValidation(formCtx.validationResolved),
      [formCtx.validationResolved]
    );

    if (!validation) return <>{children}</>;
    if (!_eval) return null;
    return <>{children}</>;
  }

  function Field<
    TProps extends {
      [k: string]: any;
    } = React.InputHTMLAttributes<HTMLInputElement>
  >(props: FieldProps<TProps, T>) {
    const formctx = useContext(FormCxt);

    useEffect(() => {
      _field_register.set(_field_register.get().concat(props.field));
      if (_field_register.get().filter((x) => x === props.field).length > 1) {
        console.warn(
          `Field '${
            props.field as string
          }' has been declare more than once, it might cause some conflicts`
        );
      }
      const value = formctx.value;
      if (!value)
        throw new Error(
          "<Field> Component only can be rendered by <Form> Component from the HOC call"
        );

      return () => {
        if (_field_register.get().some((x) => x === props.field))
          _field_register.set(
            _field_register.get().filter((x) => x !== props.field)
          );
      };
    }, []);

    function handleChange<Key extends keyof T>(key: Key, newValue: T[Key]) {
      if (formctx.onChange) formctx.onChange(key, newValue);
    }

    const isDisabled = props.onChange === null || props.disabled;

    return (
      <ControlView
        {...props}
        value={formctx.value?.[props.field]}
        onChange={!isDisabled && handleChange}
        disabled={isDisabled}
      />
    );
  }

  function useFormValue() {
    const { value: FormValue, itemManager } = useContext(FormCxt);
    const [value, setValue] = useState<FormValueStateResolved<T>>(() => ({
      value: FormValue,
      isValidated: undefined,
    }));

    useEffect(() => {
      itemManager.addEventListenner("change", (state) => {
        const validated = CheckValidation(state.isValidated);
        setValue({
          value: state.value,
          isValidated: validated,
        });
      });

      return () => {
        itemManager.removeEventListenner("change");
      };
    }, []);

    return value;
  }

  return { Field, Form, useFormValue, Submit };
}
