/**
 * This file contains methods that eXtend the Biologica.js library
 * https://github.com/concord-consortium/biologica.js
 * 
 */

if (typeof exports === 'undefined') {
    var exports = window;
}

(function () {

    BiologicaX = {};
    exports.BiologicaX = BiologicaX;

    BiologicaX.randomizeAlleles = function(species, genes, alleles) {

        var allelesToRandomize = [];
        var genesLength = genes.length;
        for (var i = 0; i < genesLength; i++) {
            var gene = genes[i];
            allelesToRandomize.push(BiologicaX.findAllele(species, alleles, 'a', gene));
            allelesToRandomize.push(BiologicaX.findAllele(species, alleles, 'b', gene));
        }
        var allelesToRandomize = shuffle(allelesToRandomize);

        var randomAllelesTarget = minRandomAlleles + ExtMath.randomInt(maxRandomAlleles - minRandomAlleles);
        var totalRandomizedAlleles = 0;

        var allelesToRandomizeLength = allelesToRandomize.length;
        for (var i = 0; i < allelesToRandomizeLength; i++) {
            var originalAllele = allelesToRandomize[i];
            var randomAllele = BiologicaX.getRandomAllele(
                species,
                BiologicaX.getGene(species, originalAllele),
                BiologicaX.getSide(originalAllele),
                [originalAllele]);
            alleles = alleles.replace(originalAllele, randomAllele);
            ++totalRandomizedAlleles;
            if (totalRandomizedAlleles >= randomAllelesTarget) {
                break;
            }
        }

        return alleles;
    }

    BiologicaX.getRandomAllele = function(species, gene, side, excluding) {
        var randomAllele = null;
        var allelesLength = species.geneList[gene].alleles.length;
        var i = ExtMath.randomInt(allelesLength);
        while (randomAllele == null || excluding.includes(randomAllele)) {
            randomAllele = side + ':' + species.geneList[gene].alleles[i];
            if (++i >= allelesLength) {
                i = 0;
            }
        }
        return randomAllele;
    }

    BiologicaX.replaceAllele = function(gene, alleles, newAllele) {
        var side = BiologicaX.getSide(newAllele);
        return alleles.replace(BiologicaX.findAllele(alleles, side, gene), newAllele);
    }

    BiologicaX.getSide = function(allele) {
        return allele.match(/[a-b]/);
    }

    BiologicaX.getGene = function(species, allele) {
        var geneName = null;
        var alleleWithoutSide = allele.replace(/.+:/, "");

        Object.keys(species.geneList).forEach(function (key, index) {
            if (species.geneList[key].alleles.includes(alleleWithoutSide)) {
                geneName = key;
                return false;
            }
        });
        return geneName;
    }

    BiologicaX.findAllele = function(species, alleles, side, gene) {
        var allOptions = '(?:' + species.geneList[gene].alleles.join('|') + ')';
        var regex = new RegExp(side + ':' + allOptions, '');
        return alleles.match(regex).toString();
    }

    BiologicaX.getAlleleAsInheritancePattern = function(species, alleles, gene) {
        var sideA = BiologicaX.findAllele(species, alleles, 'a', gene).replace('a:', '');
        var sideB = BiologicaX.findAllele(species, alleles, 'b', gene).replace('b:', '');

        // NOTE: This function assusmes that capital letter in the allele indicates
        // present while a lowercase letter indicates the gene is not present.
        var leftH = sideA[0] == sideA[0].toUpperCase() ? 'H' : 'h';
        var rightH = sideB[0] == sideB[0].toUpperCase() ? 'H' : 'h'; 
        
        return leftH + '-' + rightH;
    }    

    BiologicaX.getInheritancePatternForGene = function(organism, gene) {
        var characteristic = null; 
        if (gene == 'metallic') {
            characteristic = organism.getCharacteristic('color');
            if (characteristic == 'Steel'
                || characteristic == 'Copper'
                || characteristic == 'Silver'
                || characteristic == 'Gold') {
                    characteristic = 'Metallic';
                } else {
                    characteristic = 'Nonmetallic';
                }
        } else {
            characteristic = organism.getCharacteristic(gene);
        }

        console.log('characteristic=' + characteristic);

        var pattern = null;
        var alleleLabelMap = organism.species.alleleLabelMap;
        for (var allele in alleleLabelMap) {
            if (alleleLabelMap.hasOwnProperty(allele)) {
                if (alleleLabelMap[allele] == characteristic) {
                    if (allele[0] == allele[0].toUpperCase()) {
                        pattern = 'Dominant';
                    } else {
                        pattern = 'Recessive';
                    }
                    break;
                }
            }
        }        

        return pattern;
    }      

}).call(this);