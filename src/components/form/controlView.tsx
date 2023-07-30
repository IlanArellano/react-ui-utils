import React, { forwardRef, useEffect, useMemo, useState } from "react";
import { Log } from "@utils/common/log";
import { Form, Input } from "./FormComp";
import type { FieldProps, FormProps } from "./index";
import { Client } from "@utils/common/namespaces/client";
import { omit } from "@utils/common";

export const ControlView = forwardRef<
  any,
  FieldProps<{ [k: string]: any }, any>
>((props) => {
  const Component = props.render;
  const CompProps = useMemo(
    () => omit(props, "field", "render", "value", "onChange"),
    [props]
  );
  const value = (props.value as any)?.[props.field];

  const handleChange = (ev: any) => {
    const value = ev.value || ev.target.value || ev;
    props.onChange(props.field, value);
  };

  if (!Component) {
    if (!Client.isClientSide()) return null;
    return <Input {...CompProps} value={value} onChange={handleChange} />;
  }

  return <Component {...CompProps} value={value} onChange={handleChange} />;
});

export const ControlForm = forwardRef<
  any,
  FormProps<any, { [k: string]: any }>
>((props, ref) => {
  const Component = props.render;
  const [update, setUpdate] = useState<boolean>(false);
  const CompProps = useMemo(
    () => omit(props, "field", "render", "value", "onChange"),
    [props]
  );

  const isClient = useMemo(() => Client.isClientSide(), []);

  useEffect(() => {
    if (!Component) Log.debug.warn("sdas");
    setUpdate(true);
  }, []);

  if (update === false) return null;
  if (!Component) {
    if (isClient) return <Form {...CompProps} />;
    return <>{props.children}</>;
  }
  return <Component ref={ref} {...CompProps} />;
});
