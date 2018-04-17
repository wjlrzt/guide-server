'use strict';

const _ = require('lodash');

class ConceptHints {   
    constructor(source, id, conceptId, tags, hints) {
        this.findReplacementBlock = new RegExp("\\[(?:([^\\]\\:]+)\\:)?([^\\]]*)\\]", "i");
        this.source = source;
        this.id = id;
        this.conceptId = conceptId;
        this.tags = tags;
        this.hints = hints;

        if (!this.hints || this.hints.length == 0) {
            throw new Error("No hints defined for concept.")
        }
    }

    sourceUrl() {
        return this.source + '/edit#gid=0?range=' + this.id + ':' + this.id;
    }

    getHint(hintLevel, substitutionVariables) {
        if (hintLevel >= this.hints.length) {
            throw new Error("Requested hint level (" + hintLevel + ") not defined in: " + this.sourceUrl());
        }

        let hint = this.hints[hintLevel];

        return this._substituteHintVariables(hint, substitutionVariables);
    }

    // Substituion variables have the following format:
    //   [<variableName>: <phrase1>, <phrase2>, ...]
    // Where the <phrase> is selected by the variable value
    // Example 1: 
    //   [selectedTrait: dull, wingless, armless, legless, not gray, without color, has horns]
    // Becomes:
    //   not gray
    // If the variable value is "gray"
    //
    // Example 2: simply substitute the the variable value itself:
    //   [selectedTrait]
    // Becomes:
    //   gray
    // If the variable value is "gray"
    _substituteHintVariables(hint, substitutionVariables) {

        var value = hint;
        do {
            var replacementBlock = value.match(this.findReplacementBlock);
            if (replacementBlock != null) {
                var block = replacementBlock[0];
                var missingValue = block.replace("[","<").replace("]",">");

                let selector = missingValue;
                let phrases;
                if (replacementBlock.length > 2) {
                    // Does substitution string contain phrases?
                    if (replacementBlock[1] != undefined) {
                        selector = replacementBlock[1];
                        phrases = replacementBlock[2];
                    } else if (replacementBlock[2] != undefined) {
                        // If not, don't define phrases and default to simple replacement
                        selector = replacementBlock[2];
                    }
                } 
                
                // Default the substituion string to the variable name in case it isn't
                // defined in the substitutionVariables
                var substitutionPhrase = selector;

                let variable = substitutionVariables[selector];
                if (variable) {
                    // Default to the the substitution variable
                    substitutionPhrase = variable;
                    if (phrases) {
                        // Use a phrase is one is defined
                        var findPhrase = new RegExp("([^,\\[]*" + variable + "[^,\\]]*)", "i");
                        var phraseMatch = phrases.match(findPhrase);
                        if (phraseMatch != null) {
                            substitutionPhrase = phraseMatch[0];
                        }
                    } 
                }
                else 
                {
                    console.warn("Unable to find substitution for: " + block);
                }

                value = value.replace(block, substitutionPhrase.trim());
            }
        } while (replacementBlock != null);

        return value;
    }    
}

module.exports = ConceptHints;