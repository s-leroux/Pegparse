<a name="module_grammar"></a>

## grammar

* [grammar](#module_grammar)
    * [~Grammar](#module_grammar..Grammar)
        * [.define()](#module_grammar..Grammar+define)
        * [.parser()](#module_grammar..Grammar+parser)
    * [~charset()](#module_grammar..charset)
    * [~litteral()](#module_grammar..litteral)
    * [~nat()](#module_grammar..nat)
    * [~not()](#module_grammar..not)
    * [~and()](#module_grammar..and)
    * [~any()](#module_grammar..any)
    * [~rule(name)](#module_grammar..rule)
    * [~concat()](#module_grammar..concat)
    * [~choice()](#module_grammar..choice)
    * [~zeroOrOne()](#module_grammar..zeroOrOne)
    * [~zeroOrMore()](#module_grammar..zeroOrMore)
    * [~oneOrMore()](#module_grammar..oneOrMore)
    * [~capture()](#module_grammar..capture)

<a name="module_grammar..Grammar"></a>

### grammar~Grammar
The Grammar class.

**Kind**: inner class of [<code>grammar</code>](#module_grammar)  

* [~Grammar](#module_grammar..Grammar)
    * [.define()](#module_grammar..Grammar+define)
    * [.parser()](#module_grammar..Grammar+parser)

<a name="module_grammar..Grammar+define"></a>

#### grammar.define()
Define a new rule.

**Kind**: instance method of [<code>Grammar</code>](#module_grammar..Grammar)  
**Param{string}**: name - The name of the rule  
**Param{}**: program - The program associated with that rule  
**Param{)**: action - An optionable callable to invoke if a match is found.
      The default action is to pack all program's capture in a possible empty
      array.  
<a name="module_grammar..Grammar+parser"></a>

#### grammar.parser()
Return a new [Parser](Parser) for the grammar.

**Kind**: instance method of [<code>Grammar</code>](#module_grammar..Grammar)  
**Param{string}**: start - The name of the rule to match.  
<a name="module_grammar..charset"></a>

### grammar~charset()
Match one character if present in the given charset.

  Charsets may be specified either as a string containing all the chars
  in the set ("0123456789"), or a range ("0-9").

**Kind**: inner method of [<code>grammar</code>](#module_grammar)  
<a name="module_grammar..litteral"></a>

### grammar~litteral()
Match a string of characters.

  Capture each character individually.

**Kind**: inner method of [<code>grammar</code>](#module_grammar)  
<a name="module_grammar..nat"></a>

### grammar~nat()
Negative lookarround.

  Move the token pointer relative to the current position and
  check the given program do _not_ match. Can be used as a negative
  lookbehind (delta < 0) or lookafter (delta >= 0). In all cases,
  restore the input to its previous position on exit.

  Capture nothing.

**Kind**: inner method of [<code>grammar</code>](#module_grammar)  
<a name="module_grammar..not"></a>

### grammar~not()
The _not_ predicate.

  Succeed if the given program fails with the current input.
  Do not consume any character.

  Capture nothing.

**Kind**: inner method of [<code>grammar</code>](#module_grammar)  
<a name="module_grammar..and"></a>

### grammar~and()
The _and_ predicate

  Succeed if the given program succeed, but without consuming any character.
  Can be used as a positive lookahead.

  Capture nothing.

**Kind**: inner method of [<code>grammar</code>](#module_grammar)  
<a name="module_grammar..any"></a>

### grammar~any()
Match any character. Fail only if there is no more token to process.

  Capture the matched character.

**Kind**: inner method of [<code>grammar</code>](#module_grammar)  
<a name="module_grammar..rule"></a>

### grammar~rule(name)
Match a rule of the grammar.

**Kind**: inner method of [<code>grammar</code>](#module_grammar)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | The name of the rule to match. The rule does not have     already exist. It might be defined later. |

<a name="module_grammar..concat"></a>

### grammar~concat()
Concatenation of several programs.

  Will match the sequence:
  programs[0],programs[1],programs[2]..programs[n]

**Kind**: inner method of [<code>grammar</code>](#module_grammar)  
<a name="module_grammar..choice"></a>

### grammar~choice()
Ordered choice.

  Try to match each alternative in its own turn. Stop trying
   once there is a match. Fail if there is no match.

**Kind**: inner method of [<code>grammar</code>](#module_grammar)  
<a name="module_grammar..zeroOrOne"></a>

### grammar~zeroOrOne()
The zero-or-one quantifier.

  Match 0 or 1 repetition of a program.


  If there is no match, capture the _undefined_ special value.

**Kind**: inner method of [<code>grammar</code>](#module_grammar)  
<a name="module_grammar..zeroOrMore"></a>

### grammar~zeroOrMore()
The zero-or-more quantifier.

  Match 0, 1 or several repetitions of the same program.

**Kind**: inner method of [<code>grammar</code>](#module_grammar)  
<a name="module_grammar..oneOrMore"></a>

### grammar~oneOrMore()
The one-or-more quantifier.

  Match 1 or several repetitions of the same program.

**Kind**: inner method of [<code>grammar</code>](#module_grammar)  
<a name="module_grammar..capture"></a>

### grammar~capture()
Capture the data from a sub-program into an array.

  This allow data capture without requiring to define
  a new rule specifically for that.

**Kind**: inner method of [<code>grammar</code>](#module_grammar)  
