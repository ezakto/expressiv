expressiv
=========

A markdown-like language / parser

## Inline tokens

The most basic inline tokens are very similar to their markdown counterparts, with a few additions.
Special characters can be escaped with \

```
Lorem *ipsum\\\* dolor* **sit** amet _consectetur_ adipsicing elit.
```

```
Lorem <em>ipsum* dolor</em> <strong>sit</strong> amet <u>consectetur</u> adipsicing elit.
```

#### Links and emails

```
Lorem ->ipsum (http://www.example.com) dolor sit amet consectetur@adipsicing.elit.
```

```
Lorem <a href="http://www.example.com">ipsum</a> dolor sit amet <a href="mailto:consectetur@adipsicing.elit">consectetur@adipsicing.elit</a>.
```

#### Images

```
Lorem [[http://www.example.com/mypic.gif]] dolor sit amet [[My picture|http://www.example.com/mypic.gif]] consectetur adipsicing elit.
```

```
Lorem <img src="http://www.example.com/mypic.gif" alt=""> dolor sit amet <img src="http://www.example.com/mypic.gif" alt="My picture" title="My picture"> consectetur adipsicing elit.
```

#### Twitter

```
Lorem @ipsum dolor sit amet #consectetur adipsicing elit.
```

```
Lorem <a href="http://twitter.com/ipsum">@ipsum</a> dolor sit amet <a href="http://twitter.com/search?q=%23consectetur&src=hash">#consectetur</a> adipsicing elit.
```

## Block level tokens

#### Paragraphs

All those text blocks that aren't wrapped by a *special* block are parsed as paragraphs. Paragraphs end with a double newline, while a simple newline is parsed as a line break.

```
Hello there.
This is a paragraph.

This is another one.
```

Turns into:

```
<p>
    Hello there.<br>
    This is a paragraph.
</p>
<p>
    This is another one.
</p>
```

#### Blockquotes

Start and end with `"`

```
"
Somebody said this.
"
```

```
<blockquote>
    Somebody said this.
</blockquote>
```

#### Code blocks

Start and end with `@`

```
@
<?php
    echo 'Hello world';
?>
@
```

```
<pre><?php
    echo 'Hello world';
?></pre>
```

#### Headings

Go from # (h2) to ##### (h6):

```
## Section title
```

```
<h3>Section title</h3>
```

While h1 is reserved for main heading block:

```
Document heading
================
```

```
<header>
    <h1>Document heading</h1>
</header>
```

And this can be expanded with a subheading

```
Document heading
================
Subheading here
```

```
<header>
    <h1>Document heading</h1>
    <strong>Subheading here</strong>
</header>
```

#### Lists

```
* Item 1
* Item 2
* Item 3

1. Item 1
2. Item 2
3. Item 3
```

```
<ul>
    <li>Item 1</li>
    <li>Item 2</li>
    <li>Item 3</li>
</ul>
<ol>
    <li>Item 1</li>
    <li>Item 2</li>
    <li>Item 3</li>
</ol>
```

List items can also contain entire blocks:

```
* List item
* Block-level list item.
  Notice that this text
  mantains the indentation.
  * Nested list item
  * Nested list item 2
  More text
* Another item
```

```
<ul>
    <li>List item</li>
    <li>
        <p>
            Block-level list item.<br>
            Notice that this text<br>
            mantains the indentation.
        </p>
        <ul>
            <li>Nested list item</li>
            <li>Nested list item 2</li>
        </ul>
        <p>
            More text
        </p>
    </li>
    <li>Another item</li>
</ul>
```

#### Definition lists

```
Term 1:
    Definition here.
Term 2:
    Definitions can
    hold block level
    text too.
Term 3:
    Moar.
```

```
<dl>
    <dt>Term 1:</dt>
    <dd>Definition here.</dd>
    <dt>Term 2:</dt>
    <dd>
        <p>
            Definitions can<br>
            hold block level<br>
            text too.
        </p>
    </dd>
    <dt>Term 3:</dt>
    <dd>Moar.</dd>
</dl>
```

#### Tables

Tables are wrapped by pipes ("|"). Heading row is divided by "="s and colspans can be specified using multiple pipes.

```
|||This is the heading row, with colspan=3                |
|=========================================================|
|Simple table cell   |Another table cell|Another one      |
|This is another row ||With another cell with colspan=2   |
```

```
<table>
    <tr>
        <th colspan="3">This is the heading row, with colspan=3  </th>
    </tr>
    <tr>
        <td>Simple table cell</td>
        <td>Another table cell</td>
        <td>Another one</td>
    </tr>
    <tr>
        <td>This is another row</td>
        <td colspan="2">With another cell with colspan=2</td>
    </tr>
</table>
```

Cell text alignment can be specified via ascii-art-alignment:

```
|Simple table cell      |       right aligned cell|
||       center aligned cell with colspan=2       |
```

```
<table>
    <tr>
        <td>Simple table cell</td>
        <td style="text-align:right">right aligned cell</td>
    </tr>
    <tr>
        <td colspan="2" style="text-align:center">center aligned cell with colspan=2</td>
    </tr>
</table>
```

