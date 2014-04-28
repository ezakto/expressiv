/**
 * Expressiv - A markdown-like language / parser
 * Copyright (c) 2014 Nicolás Arias
 * MIT Licensed
 */

;(function(){

    /**
     * Stacks replacement rules and executes in order
     */
    function Replacer () {
        this.stack = [];
    }

    /**
     * Add a replace function
     * @param {Mixed} re Regular expression to replace or function
     * @param {Mixed} cb Replace callback or context for first param
     */
    Replacer.prototype.add = function (re, cb) {
        if (re instanceof Function) {
            return this.stack.push({
                cb: re,
                cx: cb || this
            });
        }

        if (!(re instanceof RegExp) && !(typeof cb !== 'string')) {
            return;
        }

        this.stack.push({
            re: re,
            cb: cb
        });
    };

    /**
     * Execute all the replacements/callbacks in order
     * @param  {String} string String to be processed
     * @return {String}        Processed string :O
     */
    Replacer.prototype.exec = function (string) {
        var i, l;
        for (i = 0, l = this.stack.length; i < l; i++) {
            if (!this.stack[i].re) {
                string = this.stack[i].cb.call(this.stack[i].cx, string) || string;
                continue;
            }
            while (this.stack[i].re.test(string)) {
                string = string.replace(this.stack[i].re, this.stack[i].cb);
            }
        }
        return string;
    };

    /**
     * Formatters
     */
    var docformatter   = new Replacer,
        blockformatter = new Replacer,
        tableformatter = new Replacer,
        listformatter  = new Replacer,
        lineformatter  = new Replacer;

    /**
     * Token dictionary
     */
    var token_dic = {},
        token_cnt = 0;

    /**
     * Saves a string and returns an id
     * @param  {String} string String to save
     * @return {String}        Identifier
     */
    function tokenize (string) {
        var token = ';;xsv;' + (token_cnt++) + ';';
        token_dic[token] = string;
        return token;
    }

    /**
     * Brings back all the hashed strings
     * @param  {String} string String to parse
     * @return {String}        Parsed string
     */
    function detokenize (string) {
        var tokens = string.match(/;;xsv;\d+;/g);
        tokens && tokens.forEach(function(token){
            string = string.replace(token, detokenize(token_dic[token]));
        });
        return string;
    }

    /**
     * Guess what...
     */
    function nl2br (string) {
        return string.replace(/\n/g, '<br>');
    }

    function trim (string) {
        return string.replace(/^\s+|\s+$/g, '');
    }

    /**
     * Prepare expressiv parser rules
     */
    function addRules () {
        // Remove ending spaces
        docformatter.add(/[^\S\n]+$/m, '');

        // Code blocks go first, because everything inside shouldn't be parsed
        docformatter.add(/^@\n([\s\S]+?)\n@$/m, function(block, content){
            return tokenize('<pre>' + content + '</pre>');
        });

        // Escape characters
        docformatter.add(/\\([^\s\w])/, function(escape, chr) {
            return tokenize(chr);
        });

        // Parse inline
        docformatter.add(lineformatter.exec, lineformatter);

        // Parse blocks
        docformatter.add(blockformatter.exec, blockformatter);

        // Detokenize all
        docformatter.add(detokenize);

        ////////////////////////////
        // Block-level formatting //
        ////////////////////////////

        // Blockquote
        blockformatter.add(/^"\n([\s\S]+?)\n"$/m, function(block, content) {
            return tokenize('<blockquote>\n' + nl2br(content) + '\n</blockquote>');
        });
        
        // Horizontal Rule
        blockformatter.add(/^(-{3,})$/m, function(block, content) {
            return tokenize('<hr>');
        });

        // Main heading with subheading
        blockformatter.add(/^([^\n]+)\n={3,}\n[^\S\n]*([^\n]+)$/m, function(block, heading, subheading) {
            return tokenize('<header><h1>' + heading + '</h1><strong>' + subheading + '</strong></header>');
        });
        
        // Main heading
        blockformatter.add(/^([^\n]+)\n={3,}$/m, function(block, heading) {
            return tokenize('<header><h1>' + heading + '</h1></header>');
        });
        
        // Simple headings
        blockformatter.add(/^(#{1,5})\s+(.+?)\s*$/m, function(block, level, heading) {
            level = level.length + 1;
            return tokenize('<h' + level + '>' + heading + '</h' + level + '>');
        });

        // Here be dragons

        // Table
        blockformatter.add(/^(?:\|[^\n]+\|\n?)+$/m, function(block) {
            return tokenize('<table>\n' + tableformatter.exec(block) + '</table>');
        });

        // Unordered list
        blockformatter.add(/^(?:^\*[^\S\n]+[^\n]+\n?)(?:^\*[^\S\n]+[^\n]+\n?|^[^\S\n]{2,}[^\n]+\n?)*$/m, function(block) {
            return tokenize('<ul>\n' + listformatter.exec(block) + '\n</ul>');
        });
        
        // Ordered list
        blockformatter.add(/^(?:^[0-9]+\.(?:[^\S\n]+)[^\n]+\n)(?:^[0-9]+\.(?:[^\S\n]+)+[^\n]+\n?|^[^\S\n]{2,}[^\n]+\n?)*$/m, function(block) {
            return tokenize('<ol>\n' + listformatter.exec(block) + '\n</ol>');
        });
        
        // Definition list
        blockformatter.add(/^(?:(\S[^:.\\\n]*)[^\S\n]*:[^\S\n]*\n(([^\S\n]{2,})([\S][^\n]*\n?)(\3([^\n]+\n?))*))+/m, function(block) {
            return tokenize('<dl>\n' + listformatter.exec(block) + '\n</dl>');
        });

        // Paragraphs
        blockformatter.add(/^(?!;;xsv;\d+;).+(\n(?!;;xsv;\d+;).+)*/m, function(block){
            return tokenize('<p>\n' + nl2br(block) + '\n</p>');
        });

        ///////////////////////
        // Helper formatters //
        ///////////////////////
        
        // Table row
        tableformatter.add(/^(?:(\|[^\n]+)\|(\n\|[|=]+\|)?)$/m, function(block, td, th) {
            var i, l, table = '', colspan, chr = th ? 'th' : 'td';
            td = td.split(/\|(\|*)/).slice(1);
            for (i = 0, l = td.length; i < l; i++) {
                if (i % 2 === 0) {
                    colspan = td[i].length + 1;
                } else {
                    table += '<' + chr + 
                             (colspan > 1 ? ' colspan="' + colspan + '">' : '') +
                             (/^[^\S\n].*\S$/     .test(td[i]) ? ' style="text-align:right"'  : '') +
                             (/^[^\S\n].*[^\S\n]$/.test(td[i]) ? ' style="text-align:center"' : '') +
                             '>' + trim(td[i]) + '</' + chr + '>';
                }
            }
            return '<tr>' + table + '</tr>';
        });

        // List item
        listformatter.add(/^(?:(?:[0-9]+\.|\*)\s+([^\n]+(\n([^\S\n]{2,})[^\n]*(?:\n\3[^\n]*)*)?))$/m, function(block, content, indented, indent) {
            if (!!indented) {
                content = content.replace(new RegExp('^' + indent, 'gm'), '');
                return '<li>\n' + blockformatter.exec(content) + '\n</li>';
            }
            return '<li>\n' + lineformatter.exec(content) + '\n</li>';
        });
        
        // Definition list item
        listformatter.add(/^(?:(\S[^:.\\\n]*)\s*:\s*\n(([^\S\n]{2,})([\S][^\n]*\n?)(\3([^\n]+\n?))*))/m, function(block, term, content, indent) {
            content = content.replace(new RegExp('^' + indent, 'gm'), '');
            return tokenize('<dt>' + term + '</dt>\n<dd>\n' + blockformatter.exec(content) + '</dd>') + '\n';
        });

        ///////////////////////
        // Inline formatting //
        ///////////////////////

        // Emphasis
        lineformatter.add(/(\b_|\*\*|\*)((?:[^\s].*?|)(?:[^\s]\*?))\1/, function(block, chr, content) {
            content = tokenize(lineformatter.exec(content));
            switch (chr) {
                case '*':
                    return '<em>' + content + '</em>';
                    break;
                case '**':
                    return '<strong>' + content + '</strong>';
                    break;
                case '_':
                    return '<u>' + content + '</u>';
                    break;
            }
        });
        
        // Links
        lineformatter.add(/(?:->([a-z]+:\/\/[a-z0-9][a-z0-9\-._~:\/?#\[\]@!$&'()*+,;=]*|\.?\/[a-z0-9\-._~:\/?#\[\]@!$&'()*+,;=]+)|->([^\n(]+)\(([a-z0-9\-._~:\/?#\[\]@!$&'()*+,;=]+)\))/i, function(block, urltext, text, url) {
            if (!!text) return '<a href="' + tokenize(url) + '">' + text + '</a>';
            urltext = tokenize(urltext);
            return '<a href="' + urltext + '">' + urltext + '</a>';
        });
        
        // Images
        lineformatter.add(/\[\[([^|\[\]<>\n]+)(?:\|([^|\[\]<>\n]*))?\]\]/, function(block, a, b) {
            a = tokenize(a);
            if (!!b) {
                return '<img src="' + tokenize(b) + '" alt="' + a + '" title="' + a + '">';
            }
            return '<img src="' + a + '" alt="">';
        });
        
        // Email
        lineformatter.add(/\b[a-z0-9_.]+@(?:[a-z0-9_.-])+\.[a-z]{2,10}\b/i, function(block) {
            block = tokenize(block);
            return '<a href="mailto:' + block + '">' + block + '</a>';
        });
        
        // Twitter mention
        lineformatter.add(/@([a-z0-9_]+)/i, function(block, username) {
            username = tokenize(username);
            return '<a href="http://twitter.com/' + username + '">@' + username + '</a>';
        });
        
        // Twitter hashtag
        lineformatter.add(/#([a-z0-9_]+)/i, function(block, hashtag) {
            hashtag = tokenize(hashtag);
            return '<a href="http://twitter.com/search?q=%23' + hashtag + '&src=hash">#' + hashtag + '</a>';
        });
        
        // Superscript
        lineformatter.add(/\^(\([^\n]+?\)|[\S]+)/, function(block, content) {
            return '<sup>' + tokenize(lineformatter.exec(content)) + '</sup>';
        });
    }

    /**
     * Parses an expressiv-formatted string
     * @param  {String} input String to be formatted
     * @return {String}       Result
     */
    function Expressiv (input) {
        if (!docformatter.stack.length) addRules();
        return docformatter.exec(input);
    }

    /**
     * Expose api
     */
    Expressiv._docformatter   = docformatter,
    Expressiv._blockformatter = blockformatter,
    Expressiv._tableformatter = tableformatter,
    Expressiv._listformatter  = listformatter,
    Expressiv._lineformatter  = lineformatter;

    Expressiv.tokenize   = tokenize;
    Expressiv.detokenize = detokenize;
    Expressiv.Replacer   = Replacer;

    /**
     * Expose parser
     */
    if (typeof module !== 'undefined' && typeof exports !== 'undefined') {
        module.exports = Expressiv;
    } else if (typeof define === 'function' && define.amd) {
        define(function() { return Expressiv; });
    } else {
        this.Expressiv = Expressiv;
    }

})();