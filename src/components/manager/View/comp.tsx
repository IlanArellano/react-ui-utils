import React from "react";

export type OnCloseResult<T> = undefined extends T
  ? (result?: T) => void
  : (result: T) => void;

export interface ViewProps<IResult = any> {
  onClose: OnCloseResult<IResult>;
}

export interface Entry {
  id: number;
  render: React.ComponentType<ViewProps>;
  props: ViewProps;
}

export interface ViewComponentProps {
  views: Entry[];
  nextId: number;
}

export function ViewMainComponent(props: ViewComponentProps) {
  const x = props.views;
  if (x.length === 0) return null;
  return (
    <>
      {x.map((view) => {
        const C = view.render;
        return <C key={view.id} {...view.props} />;
      })}
    </>
  );
}
