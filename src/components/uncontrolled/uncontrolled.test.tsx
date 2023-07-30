import React, { PureComponent, ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import createUncontrolledClassComponent from ".";

class ClassComponent extends PureComponent<{}, { counter: number }> {
  constructor(props: {}) {
    super(props);
    this.state = {
      counter: 0,
    };
  }

  setCouter() {
    this.setState((prev) => ({
      counter: prev.counter + 1,
    }));
  }

  getCounter() {
    return this.state.counter;
  }

  render(): ReactNode {
    return <>Render</>;
  }
}

describe("render classComponentManager", () => {
  const manager = createUncontrolledClassComponent(ClassComponent, {
    setCounter: (instance) => {
      return instance().setCouter();
    },
    getCounter: (instance) => {
      return instance().getCounter();
    },
  });

  it("should render by default", () => {
    render(<manager.Component />);

    expect(screen.getByText(/Render/)).toBeInTheDocument();
  });

  it("should method getCounter return a number", () => {
    render(<manager.Component />);

    const getCounter = manager.getCounter();

    setTimeout(() => {
      expect(getCounter).toBe(0);
    }, 500);
  });
});
