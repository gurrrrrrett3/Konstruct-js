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

  getMin = () => this.min;
  getMax = () => this.max;

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
    
    getType = () => this.type;
    getContent = () => this.content;
    getScope = () => this.scope;

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

    private readonly variables:  Map<String, Variable>
    private readonly localVariables: Map<String, Variable>
    private readonly functions:  Map<String, KonstructFunction>

    getVariables = () => this.variables;
    getLocalVariables = () => this.localVariables;
    getFunctions = () => this.functions;

     /**
     * Constructs a basic context
     * @param functions {@link KonstructFunction}'s that should be accessible
     * @param variables Variables that should be accessible
     */
    constructor(functions: Map<String, KonstructFunction>, variables: Map<String, Variable>, localVariables?: Map<String, Variable>) {
        this.functions = functions;
        this.variables = variables;
        this.localVariables = localVariables || new Map<String, Variable>();
    }

    /**
     * Returns a global variable in this context.
     * @param key Key for the variable
     * @return The variable
     */
    public getVariable(key: string): Variable | undefined {
        return this.variables.get(key) ? this.variables.get(key) : this.localVariables.get(key);
    }

     /**
     * Returns an optional of a {@link KonstructFunction} that is in this context.
     * @param key The key for the function within the functions map
     * @return The {@link KonstructFunction}, if present
     */
    public getFunction(key: string): KonstructFunction | undefined {
        return this.functions.get(key);
    }


    /**
     * Adds a local variable to the context.
     * @param key Key for the variable
     * @param variable Variable to add
     */

    public addLocalVariable(key: string, variable: Variable) {
        this.localVariables.set(key, variable);
    }

      /**
     * Returns a local variable if it exists
     * @param key Key that the variable has
     * @return The {@link Variable}. If it is not a local variable it will not be returned.
     */
    public getLocalVariable(key: string): Variable | undefined {
        return this.localVariables.get(key);
    }

    public copy(): ParseContext {
        return new ParseContext(this.functions, this.variables, this.localVariables);
    }

    public addFunction(key: string, func: KonstructFunction) {
        if (this.functions.has(key)) throw new NodeException(`Function ${key} already exists`);
        this.functions.set(key, func);
    }

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

  public getFunctions = () => this.functions;

  abstract getString(): string;
  
  abstract getTypeName(): string;

  public add(other: KonstructObject<any>): KonstructObject<any> {
    return new StringObject(this.getString() + other.getString());
  }

  public subtract(other: KonstructObject<any>): KonstructObject<any> {
    throw new NodeException(`Type ${this.getTypeName()} cannot be subtracted!`)
  }

  public multiply(other: KonstructObject<any>): KonstructObject<any> {
    throw new NodeException(`Type ${this.getTypeName()} cannot be multiplied!`)
  }

  public divide(other: KonstructObject<any>): KonstructObject<any> {
    throw new NodeException(`Type ${this.getTypeName()} cannot be divided!`)
  }
  
  public intDevide(other: KonstructObject<any>): KonstructObject<any> {
    throw new NodeException(`Type ${this.getTypeName()} cannot be int divided!`)
  }

  public modulo(other: KonstructObject<any>): KonstructObject<any> {
    throw new NodeException(`Type ${this.getTypeName()} cannot be modulo'd!`)
  }
 
  public gate(gate: Gate, other: KonstructObject<any>): KonstructObject<any> {
    throw new NodeException(`Type ${this.getTypeName()} cannot be gated!`)
  }

  public getBoolean(): boolean {
    throw new NodeException(`Type ${this.getTypeName()} cannot be evaluated as a boolean!`)
  }

  public greaterThan(other: KonstructObject<any>): boolean {
    throw new NodeException(`Type ${this.getTypeName()} cannot be evaluated greater than!`)
  }

  public lessThan(other: KonstructObject<any>): boolean {
    throw new NodeException(`Type ${this.getTypeName()} cannot be evaluated less than!`)
  }

  public greaterThanEqual(other: KonstructObject<any>): boolean {
    throw new NodeException(`Type ${this.getTypeName()} cannot be evaluated greater than or equal to!`)
  }
  
  public lessThanEqual(other: KonstructObject<any>): boolean {
    throw new NodeException(`Type ${this.getTypeName()} cannot be evaluated less than or equal to!`)
  }

  public length(): number {
    throw new NodeException(`Type ${this.getTypeName()} cannot be evaluated for length!`)
  }

  public get(index: KonstructObject<any>): KonstructObject<any> {
    throw new NodeException(`Type ${this.getTypeName()} cannot be indexed!`)
  }
  
  public equal(other: KonstructObject<any>): BooleanObject {
    return new BooleanObject(this.equals(other));
  }

  public notEqual(other: KonstructObject<any>): BooleanObject {
    return new BooleanObject(!this.equals(other));
  }

  private equals(other: KonstructObject<any>): boolean {
    return this.getString() === other.getString();
  }

  public execute(scope: number, functionName: string, context: ParseContext, args: BasicNode[]): Result {
    const func = this.functions.get(functionName);
    if (!func) {
      throw new NodeException(`No function named ${functionName} for object type ${this.getTypeName()} found!`);
    }
    if (!func.getArgumentCount().isInRange(args.length)) {
      throw new NodeException(`Function ${functionName} for object type ${this.getTypeName()} requires ${func.getArgumentCount().getMin()} to ${func.getArgumentCount().getMax()} arguments, but ${args.length} were provided!`);
    }
    const newThis: K = this as any as K;
    const result = func.parse(content, newThis, args)

    if (KonstructFunction.shouldReturn(result)) {
      return result
    }
    return new Result(ResultType.SUCCESS, result.getContent())
  }

}

// from BooleanObject.java https://github.com/DarkKronicle/Konstruct/blob/ee6e0bcea1ae5a49e9b8e58edcf2752cdfab2bea/core/src/main/java/io/github/darkkronicle/Konstruct/type/BooleanObject.java

class BooleanObject extends KonstructObject<BooleanObject> {
  public static readonly TYPE_NAME = "boolean";
  private readonly value: boolean;
  constructor(value: boolean) {
    super([]);
    this.value = value;
  }

  public getString(): string {
    return BooleanObject.boolToString(this.value);
  }

  public getTypeName(): string {
    return BooleanObject.TYPE_NAME;
  }

  public static boolToString(value: boolean): string {
    return value.toString()
  }
  
  public static stringToBool(value: string): boolean {
    return value === "true";
  }
  
  public gate(gate: Gate, other: KonstructObject<any>): KonstructObject<any> {
      return new BooleanObject(gate.evaluate(this.getBoolean(), other.getBoolean()));
  }

  public static fromObject(object: KonstructObject<any>) {
    if (object instanceof BooleanObject) {
      return object.value;
    }
    return this.stringToBool(object.getString());
  }

  public equal(other: KonstructObject<any>): BooleanObject {
      if (other instanceof BooleanObject) {
        return new BooleanObject(this.value === other.value)
      }
      return super.equal(other);
  }

  public notEqual(other: KonstructObject<any>): BooleanObject {
      if (other instanceof BooleanObject) {
        return new BooleanObject(this.value !== other.value);
      }
      return super.notEqual(other);
  }

  public getBoolean(): boolean {
    return this.value;
  }
}

// from StringObject.java https://github.com/DarkKronicle/Konstruct/blob/main/core/src/main/java/io/github/darkkronicle/Konstruct/type/StringObject.java

class StringObject extends KonstructObject<StringObject> {
    public static readonly TYPE_NAME = "string";

    private readonly value: string;

    private static readonly FUNCTONS: ObjectFunction<StringObject>[] = [
        new class implements ObjectFunction<any> {
            parse(context: ParseContext, self: StringObject, input: BasicNode[]): Result {
                return Result.success(new StringObject(self.value.toLowerCase()))
            }
            getName() {
                return "lower";
            }
            getArgumentCount = () => IntRange.ofSingle(0)
        },
        new class implements ObjectFunction<any> {
            parse(context: ParseContext, self: StringObject, input: BasicNode[]): Result {
              return Result.success(new StringObject(self.value.toUpperCase())) 
            }
            getName() {
                return "upper";
            }
            getArgumentCount = () => IntRange.ofSingle(0)
        }
    ]

    constructor(value: string) {
        super(StringObject.FUNCTONS);
        this.value = value;
    }

    getString(): string {
        return this.value;
    }

    getTypeName(): string {
        return StringObject.TYPE_NAME;
    }

    public add(other: KonstructObject<any>): KonstructObject<any> {
        return new StringObject(this.getString() + other.getString());
    }
} 

// from DoubleObject.java

class DoubleObject extends KonstructObject<DoubleObject> {
    public static readonly TYPE_NAME = "double";
    private readonly value: number;
    constructor(value: number) {
        super([]);
        this.value = value;
    }

    getValue = () => this.value;
    getString = () => this.value.toString();
    getTypeName = () => DoubleObject.TYPE_NAME;

    add(other: KonstructObject<any>): KonstructObject<any> {
        if (other instanceof DoubleObject) {
            return new DoubleObject(this.value + other.getValue());
        }
        if (other instanceof IntegerObject) {
          return new DoubleObject(other.getValue() + this.getValue());
      }
      return new StringObject(this.getString() + other.getString());
    }

    subtract(other: KonstructObject<any>): KonstructObject<any> {
        if (other instanceof DoubleObject) {
            return new DoubleObject(this.value - other.getValue());
        }
        if (other instanceof IntegerObject) {
          return new DoubleObject(this.value - other.getValue());
      }
      throw new NodeException(`Cannot subtract ${other.getTypeName()} from ${this.getTypeName()}`);
    }

    multiply(other: KonstructObject<any>): KonstructObject<any> {
        if (other instanceof DoubleObject) {
            return new DoubleObject(this.value * other.getValue());
        }
        if (other instanceof IntegerObject) {
          return new DoubleObject(this.value * other.getValue());
      }
      throw new NodeException(`Cannot multiply ${other.getTypeName()} with ${this.getTypeName()}`);
    }
    
    public modulo(other: KonstructObject<any>): KonstructObject<any> {
        if (other instanceof DoubleObject) {
            return new DoubleObject(this.value % other.getValue());
        }
        if (other instanceof IntegerObject) {
          return new DoubleObject(this.value % other.getValue());
      }
      throw new NodeException(`Cannot modulo ${other.getTypeName()} with ${this.getTypeName()}`);
    }

    divide(other: KonstructObject<any>): KonstructObject<any> {
        if (other instanceof DoubleObject) {
            return new DoubleObject(this.value / other.getValue());
        }
        if (other instanceof IntegerObject) {
          return new DoubleObject(this.value / other.getValue());
      }
      throw new NodeException(`Cannot divide ${other.getTypeName()} with ${this.getTypeName()}`);
    }

    intDevide(other: KonstructObject<any>): KonstructObject<any> {
        if (other instanceof DoubleObject) {
            return new IntegerObject(Math.floor(this.value / other.getValue()));
        }
        if (other instanceof IntegerObject) {
          return new IntegerObject(Math.floor(this.value / other.getValue()));
      }
      throw new NodeException(`Cannot divide ${other.getTypeName()} with ${this.getTypeName()}`);
    }
    
    greaterThan(other: KonstructObject<any>): boolean {
        if (other instanceof DoubleObject) {
            return this.value > other.getValue();
        }
        if (other instanceof IntegerObject) {
          return this.value > other.getValue();
      }
      throw new NodeException(`Cannot compare ${other.getTypeName()} with ${this.getTypeName()}`);
    }
    
    lessThan(other: KonstructObject<any>): boolean {
        if (other instanceof DoubleObject) {
            return this.value < other.getValue();
        }
        if (other instanceof IntegerObject) {
          return this.value < other.getValue();
      }
      throw new NodeException(`Cannot compare ${other.getTypeName()} with ${this.getTypeName()}`);    
    }

    equal(other: KonstructObject<any>): BooleanObject {
        if (other instanceof DoubleObject) {
            return new BooleanObject(this.value === other.getValue());
        }
        if (other instanceof IntegerObject) {
          return new BooleanObject(this.value === other.getValue());
      }
      return super.equal(other);
    }

    notEqual(other: KonstructObject<any>): BooleanObject {
        if (other instanceof DoubleObject) {
            return new BooleanObject(this.value !== other.getValue());
        }
        if (other instanceof IntegerObject) {
          return new BooleanObject(this.value !== other.getValue());
      }
      return super.notEqual(other);
    }

    static fromObject(object: KonstructObject<any>): number | undefined {
      if (object instanceof IntegerObject) {
        return object.getValue()
      }
      if (object instanceof DoubleObject) {
          return object.getValue()
      }
      const value = object.getString().trim();
      if (value.length === 0) {
        return undefined;
      }
      try {
        return Number(parseInt(value))
      } catch (e) {
        return undefined;
      }
    }

}

// from IntegerOnject.java https://github.com/DarkKronicle/Konstruct/blob/ee6e0bcea1ae5a49e9b8e58edcf2752cdfab2bea/core/src/main/java/io/github/darkkronicle/Konstruct/type/IntegerObject.java

class IntegerObject extends KonstructObject<IntegerObject> {
  public static readonly TYPE_NAME = "int";
  private readonly value: number;
  constructor(value: number) {
    super([]);
    this.value = value;
  }

  getValue = () => this.value;
  getString = () => this.value.toString();
  getTypeName = () => IntegerObject.TYPE_NAME;
  
}

/*

FUNCTIONS

*/

// from Variable.java https://github.com/DarkKronicle/Konstruct/blob/ee6e0bcea1ae5a49e9b8e58edcf2752cdfab2bea/core/src/main/java/io/github/darkkronicle/Konstruct/functions/Variable.java

/**
 * A class to return a string that is meant to be parsed in a {@link io.github.darkkronicle.Konstruct.nodes.VariableNode}
 *
 * This is similar to a {@link Function}, but no arguments are allowed. These can be static or be changing.
 */
abstract class Variable {
    abstract getValue(): KonstructObject<any>

    static of(v: string | KonstructObject<any> | (() => KonstructObject<any>)) {
        if (typeof v === "string") {
            return () => new StringObject(v) as any as Variable
        }
        if (v instanceof KonstructObject) {
            return () => v as any as Variable
        }
        return v as any as () => Variable
    }
    
    
}

// from ObjectFunction.java https://github.com/DarkKronicle/Konstruct/blob/ee6e0bcea1ae5a49e9b8e58edcf2752cdfab2bea/core/src/main/java/io/github/darkkronicle/Konstruct/functions/ObjectFunction.java
interface ObjectFunction<K extends KonstructObject<any>> {
  parse(context: ParseContext, self: K, input: BasicNode[]): Result

  getName: () => string;

  getArgumentCount: () => IntRange;
}

// from Function.java https://github.com/DarkKronicle/Konstruct/blob/ee6e0bcea1ae5a49e9b8e58edcf2752cdfab2bea/core/src/main/java/io/github/darkkronicle/Konstruct/functions/Function.java

// renamed to KonstructFunction to avoid conflict with Function in typescript

abstract class KonstructFunction {
   /**
     * Contains the result of the function
     * @param context The context of the function
     * @param input A {@link Array} of all the arguments
     * @return The processed function
     */
    abstract parse(context: ParseContext, input: Node[]): Result;


    /**
     * An {@link IntRange} for the amount of arguments to be put in.
     *
     * The {@link Function#parse(ParseContext, List)} won't be called unless the amount of arguments is within this range.
     * @return {@link IntRange} for arguments
     */
    abstract getArgumentCount(): IntRange;

     /**
     * A utility function to parse and format an argument
     * @param context {@link ParseContext} containing the context to parse the input
     * @param input A list of arguments that are {@link Node}'s
     * @throws IndexOutOfBoundsException if an index is out of bounds for the input
     * @throws io.github.darkkronicle.Konstruct.NodeException if something internally goes wrong parsing
     */
      static parseArgument(context: ParseContext, input: BasicNode[], index: number): Result{
        return input[index].parse(context);
    }

     /**
     * Checks if a result is blocking and should stop current execution.
     */
    static shouldReturn(result: Result): boolean {
        return result != null && (result.getType() == ResultType.RETURN || result.getType() == ResultType.TERMINATE);
    }

     /**
     * Checks to see if a result should be exited
     */
    static shouldExit(result: Result): boolean {
        return result != null && result.getType() == ResultType.TERMINATE;
    }
}

/*

NODES

*/

// from Node.java https://github.com/DarkKronicle/Konstruct/blob/main/core/src/main/java/io/github/darkkronicle/Konstruct/nodes/Node.java

/**
 * A class to take a {@link ParseContext} and evaluate to return a processed string
 */
abstract class BasicNode {

  /**
     * Parses a {@link Node} to get an evaluated string
     * @param context {@link ParseContext} containing {@link Variable}'s and {@link KonstructFunction}'s
     * @return Evaluated {@link Result}
     */
   abstract parse(context: ParseContext): Result;

  /**
   * Returns children node of this node. Can be empty, but shouldn't be null.
   * @return Children
   */
  getChildren(): BasicNode[] {
    // no children
    return [];
  }
/**
   * A debugging method to convert this node into a string with indenting to show all children
   * @return String containing all children
   */
  getTreeString = (): string => `\n${BasicNode.getTreeString(this)}`;

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

// from AssignmentNode.java https://github.com/DarkKronicle/Konstruct/blob/main/core/src/main/java/io/github/darkkronicle/Konstruct/nodes/AssignmentNode.java

class AssignmentNode extends BasicNode {
  private readonly name: string;
  private readonly node: BasicNode;

  constructor(name: string, node: BasicNode) {
    super();
    this.name = name;
    this.node = node;
  }
  
  getName = () => this.name;
  getNode = () => this.node;

  parse(context: ParseContext): Result {
      if (context.getVariables().has(this.name)) {
         throw new NodeException(`Variable ${this.name} already exists`);
      }  
      const result: Result = this.node.parse(context)
      if (KonstructFunction.shouldExit(result)) {
          return result
      }
      context.addLocalVariable(this.name, Variable.of(result.getContent())())
      return Result.success("")
  }

  
}

// from BooleanNode.java https://github.com/DarkKronicle/Konstruct/blob/ee6e0bcea1ae5a49e9b8e58edcf2752cdfab2bea/core/src/main/java/io/github/darkkronicle/Konstruct/nodes/BooleanNode.java

class BooleanNode extends BasicNode {
  private readonly value: boolean;
  constructor(value: boolean) {
    super();
    this.value = value;
  }

  getValue = () => this.value;
  parse(context: ParseContext): Result {
    return Result.success(new BooleanObject(this.value))
  }

  getChildren(): BasicNode[] {
    return [];
  }

  toString = () => `<boolean ${this.value}>`;

  addChild = (child: BasicNode) => {}
  
}

// from DotNode.java https://github.com/DarkKronicle/Konstruct/blob/ee6e0bcea1ae5a49e9b8e58edcf2752cdfab2bea/core/src/main/java/io/github/darkkronicle/Konstruct/nodes/DotNode.java
class DotNode extends BasicNode {

  constructor(private readonly starting: BasicNode, private readonly name: string, private readonly args: BasicNode[], private readonly scope: number) {
    super();
  }

  parse(context: ParseContext): Result {
      const node = this.starting.parse(context)
      if (KonstructFunction.shouldReturn(node)) return node;
      return node.getContent().execute(this.scope, this.name, context, this.args)
  }

  getChildren(): BasicNode[] {
      return this.args;
  }

  addChild(child: BasicNode) {}
  
  toString = () => `<dot ${this.starting.toString()} ${this.name}>`;

}

class DoubleNode extends BasicNode {
  private readonly value: number;
  constructor(value: number) {
    super();
    this.value = value;
  }
  getValue = () => this.value;
  parse(context: ParseContext): Result {
    return Result.success(new DoubleObject(this.value))
  }
  getChildren(): BasicNode[] {
    return [];
  }
  addChild = (child: BasicNode) => {}
  toString = () => `<double ${this.value}>`;
}