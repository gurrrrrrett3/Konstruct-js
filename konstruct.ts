#! /bin/node
const fs = require("fs");

const PACKAGE = {
  name: "konstruct",
  version: "1.0.0",
  description: "",
  main: "index.js",
  repository: {
    type: "git",
    url: "git+https://github.com/gurrrrrrett3/Konstruct-js.git",
  },
  keywords: [],
  author: "gurrrrrrett3, DarkKronicle",
  license: "MIT",
  bugs: {
    url: "https://github.com/gurrrrrrett3/Konstruct-js/issues",
  },
  homepage: "https://github.com/gurrrrrrett3/Konstruct-js#readme",
  devDependencies: {
    "@types/node": "^18.7.13",
  },
};

// Args parser

const args = process.argv.splice(2);

const content = fs.readFileSync(args[0], "utf8");

// @Resources

// from Konstruct.java https://github.com/DarkKronicle/Konstruct/blob/main/core/src/main/java/io/github/darkkronicle/Konstruct/Konstruct.java

class Info {
  public version: string;
  public versionProperties = new Map<string, any>();

  constructor() {
    this.version = PACKAGE.version;
  }
}

/**
 * Stores version info about the currently loaded Konstruct
 */
class Konstruct {
  public static readonly INFO = new Info();
}

// from NodeException.java https://github.com/DarkKronicle/Konstruct/blob/main/core/src/main/java/io/github/darkkronicle/Konstruct/NodeException.java

class NodeException extends Error {
  constructor(s: string);
  constructor(e: Error);
  constructor(s: string, e: Error);
  constructor(s: any, e?: any) {
    super(`${s}${e ? `\nCaused by ${e.mssage}\n${e.stack}` : ""}`);
  }
}

// from Gate.java https://github.com/DarkKronicle/Konstruct/blob/main/core/src/main/java/io/github/darkkronicle/Konstruct/Gate.java

class Gate {
  public static AND = (a: boolean, b: boolean) => a && b;
  public static OR = (a: boolean, b: boolean) => a || b;
  public static NOT = (a: boolean) => !a;
  public static XOR = (a: boolean, b: boolean) => a != b;
  public static NAND = (a: boolean, b: boolean) => !(a && b);
  public static NOR = (a: boolean, b: boolean) => !(a || b);
  public static XNOR = (a: boolean, b: boolean) => a == b;

  constructor(public type: "AND" | "OR" | "NOT" | "XOR" | "NAND" | "NOR" | "XNOR") {}

  public evaluate(a: boolean, b: boolean) {
    switch (this.type) {
      case "AND":
        return Gate.AND(a, b);
      case "OR":
        return Gate.OR(a, b);
      case "NOT":
        return Gate.NOT(a);
      case "XOR":
        return Gate.XOR(a, b);
      case "NAND":
        return Gate.NAND(a, b);
      case "NOR":
        return Gate.NOR(a, b);
      case "XNOR":
        return Gate.XNOR(a, b);
    }
  }

  public getName = () => this.type;
}

/*

PARSER

*/

class IntRange {
  constructor(public min: number, public max: number) {}

  /**
   * Checks to see if an integer is within the range of min and max.
   * @param x Number to check
   * @return If the number is within this range (inclusive).
   */
  isInRange = (value: number) => value >= this.min && value <= this.max;

  /**
   * Constructs an {@link IntRange} where a number will only be in range if it is the exact same number.
   *
   * x == value
   * @param value Number to be accepted.
   * @return Constructed {@link IntRange}
   */
  public static ofSingle(value: number): IntRange {
    return new IntRange(value, value);
  }

  /** Constructs an {@link IntRange} where a number will only be in range if it is within max and min.
   *
   * min <= x <= max
   * @param min Minimum number
   * @param max Maximum number
   * @return Constructed {@link IntRange}
   */
  public static ofMulti(min: number, max: number): IntRange {
    return new IntRange(min, max);
  }

  /**
   * Constructs an {@link IntRange} where it will only be in range if it is 0;
   *
   * x == 0
   * @return Constructed {@link IntRange}
   */
  public static none(): IntRange {
    return new IntRange(0, 0);
  }

  /**
   * Constructs an {@link IntRange} where it will be in range if the variable is less than or equal to this number.
   *
   * 0 <= x <= max
   * @param max Maximum number of the range
   * @return Constructed {@link IntRange}
   */
  public static lessThanEqual(max: number): IntRange {
    return new IntRange(0, max);
  }

  /**
   * Constructs an {@link IntRange} where it will be in range if the variable is greater than or equal to this number.
   *
   * min <= x
   * @param min Minimum number of this range.
   * @return Constructed {@link IntRange}
   */
  public static greaterThanEqual(min: number): IntRange {
    return new IntRange(min, Number.MAX_VALUE);
  }

  /**
   * Constructs an {@link IntRange} where it will be in range if the variable is any positive integer, including 0.
   *
   * x >= 0
   * @return Constructed {@link IntRange}
   */
  public static any() {
    return IntRange.greaterThanEqual(0);
  }
}

// from Result.java https://github.com/DarkKronicle/Konstruct/blob/main/core/src/main/java/io/github/darkkronicle/Konstruct/parser/Result.java
enum ResultType {
    SUCCESS,
    RETURN,
    TERMINATE
}

class Result {
    type: ResultType;

    content: KonstructObject<any>;

    scope: number;

    constructor(type: ResultType, content: KonstructObject<any>, scope: number = -1) {
        this.type = type;
        this.content = content;
        this.scope = scope || -1
    }

    public static success(content: KonstructObject<any> | string): Result {
        if (typeof content === "string") return new Result(ResultType.SUCCESS, new StringObject(content), -1);
        return new Result(ResultType.SUCCESS, content);
    }

}

class ParseContext  {

    

}



/*

TYPES

*/

//from KonstructObject.java https://github.com/DarkKronicle/Konstruct/blob/main/core/src/main/java/io/github/darkkronicle/Konstruct/type/KonstructObject.java

abstract class KonstructObject<K extends KonstructObject<any>> {
  private readonly functions = new Map<string, ObjectFunction<K>>();

  constructor(functions: ObjectFunction<K>[] | Map<string, ObjectFunction<K>>) {
    if (functions instanceof Array) {
      for (const func of functions) {
        this.functions.set(func.getName(), func);
      }
    } else {
      this.functions = functions;
    }
  }

  abstract getString(): string;
  
  abstract getTypeName(): string;

  public add(other: KonstructObject<any>): KonstructObject<any> {
    return new StringObject(this.getString() + other.getString());
  }
  
}

// from StringObject.java https://github.com/DarkKronicle/Konstruct/blob/main/core/src/main/java/io/github/darkkronicle/Konstruct/type/StringObject.java

class StringObject extends KonstructObject<StringObject> {
    public static readonly TYPE_NAME = "string";

    private readonly value: string;

    private static readonly FUNCTONS: ObjectFunction<StringObject>[] = [
        class implements ObjectFunction<any> {
            getName() {
                return "lower";
            }
            getArgumentCount = () => IntRange.ofSingle(0)
            
        }
    ]
} 

/*

FUNCTIONS

*/

/**
 * A class to return a string that is meant to be parsed in a {@link io.github.darkkronicle.Konstruct.nodes.VariableNode}
 *
 * This is similar to a {@link Function}, but no arguments are allowed. These can be static or be changing.
 */
interface Variable {
    
}


interface ObjectFunction<K extends KonstructObject<any>> {
  //parse(context: ParseContext, self: K, input: BasicNode[]): Result

  getName: () => string;

  getArgumentCount: () => IntRange;
}

/*

NODES

*/

// from Node.java https://github.com/DarkKronicle/Konstruct/blob/main/core/src/main/java/io/github/darkkronicle/Konstruct/nodes/Node.java

/**
 * A class to take a {@link ParseContext} and evaluate to return a processed string
 */
interface BasicNode {
  /**
   * Returns children node of this node. Can be empty, but shouldn't be null.
   * @return Children
   */
  getChildren: () => BasicNode[];

  /**
   * A debugging method to convert this node into a string with indenting to show all children
   * @return String containing all children
   */
  getTreeString(): string;
}

// from AssignmentNode.java https://github.com/DarkKronicle/Konstruct/blob/main/core/src/main/java/io/github/darkkronicle/Konstruct/nodes/AssignmentNode.java

class AssignmentNode implements BasicNode {
  private readonly name: string;
  private readonly node: BasicNode;

  constructor(name: string, node: BasicNode) {
    this.name = name;
    this.node = node;
  }

  // @Override
  getChildren(): BasicNode[] {
    // no children
    return [];
  }

  // @Override
  getTreeString = (): string => `\n${AssignmentNode.getTreeString(this)}`;

  static getTreeString(node: BasicNode) {
    let strings: string[] = [];
    strings.push(`- ${node.toString()}`);
    for (let child of node.getChildren()) {
      for (let string of child.getTreeString()) {
        strings.push(`| ${string}`);
      }
    }

    return strings;
  }
}
