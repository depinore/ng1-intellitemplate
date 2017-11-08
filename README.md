# ng1-intellitemplate

ng1-intellitemplate is a simple hack that allows you to take advantage of TypeScript autocomplete in AngularJS 1.x templates.
To use it, simply use a template literal surrounded by "tpl" and "/tpl" strings.

For example:
```
"tpl";
const template = `<h1>This is my template</h1>
<p>It doesn't really do much interesting.</p>`
"/tpl";
```

When it really shines is when you have an interface to data-bind to.  Given the following interfaces:
```
interface Person {
  firstName: string
  lastName: string
}
interface MyInterface {
  people: Person[]
}
```
and the following route (ui-router is used as an example):
```
{
  url: '/myroute',
  name: 'myroute',
  controller: /*...*/,
  controllerAs: 'myCtrl',  // <--- this is important
  template: myTemplate  // <---- also important
}
```

you can have the following template file that defines "myTemplate":

```

// All variables we want to use in data-binding should be defined below, with the appropriate type annotations.
var myCtrl: MyInterface;
var p: Person;

"tpl";
const myTemplate = `
  <h1>People</h1>
  <ul>
    <!-- Whenever you want auto-complete, use template literal escapes ${ ... } like so: -->
    <li ng-repeat='p in ${myCtrl.people}'>
      <!--                ^^^^^^^^^^^^^ will take advantage of your IDE's auto-complete and refactoring tooling. -->
      
      <!-- remember to use the escapes even with the "double-curly" syntax: -->
      <span>{{${p.firstName}}}</span>
      <span>{{${p.lastName}}}</span>
    </li>
  </ul>
`
"/tpl";
```

### How does this work? ###
TypeScript supports ES2015 template literals, for both ES2015, ES2016, and beyond.  Because template literals support interpolation, using escape sequences like ${ ... } will trigger autocomplet and refactoring support of your variables.

For example:

```
const name = 'bob smith'
"tpl";
const myMessage = `Hello, my name is ${name}!` 
"/tpl";
````

will give me auto-complete and refactoring support in Visual Studio on the "name" variable.

It will compile it like this for ES5:
```
var name = 'bob smith'
"tpl";
var myMessage = "Hello, my name is " + name + "!"
"/tpl";
```
ES2015 does not change the source code.

All ng1-intellitemplate does is it looks for blocks surrounded by "tpl" and "/tpl", and it will remove the escapes.  If you ran it through the previous example, it would look like this in ES5:
```
var name = 'bob smith'
"tpl";
var myMessage = "Hello, my name is name!"
"/tpl";
```

While this may not seem useful, what if we did it to an angular template?
```
var myVariable: { weight: number }
"tpl"
var myTemplate = `Hello!  <span>I weigh {{${myVariable.weight}}}</span>`
"/tpl"
```
compiles to this in ES5:
```
var myVariable: { weight: number }
"tpl"
var myTemplate = "Hello!  <span>I weigh {{" + myVariable.weight + "}}</span>"
"/tpl"
```
gets converted to this by ng1-intellitemplate:
```
var myVariable: { weight: number }
"tpl"
var myTemplate = "Hello!  <span>I weigh {{myVariable.weight}}</span>"
"/tpl"
```
Notice how myVariable.weight is now part of the string template, and no longer escaped as a proper variable.

This results in angular templates that are easy to maintain, and which get converted into a syntax that the angular data-binding engine understands! :)
