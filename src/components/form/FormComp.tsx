import React, { FormHTMLAttributes, InputHTMLAttributes } from "react";

export const Form = (props: FormHTMLAttributes<HTMLFormElement>) => {
  return <form {...props} />;
};

export const Input = (props: InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} />
);
