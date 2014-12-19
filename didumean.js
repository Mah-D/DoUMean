var DoUMean = function(array){
    largeChunk = 3;
    smallChunk = 2;
	var tokenWeight = 2;
	var notWord = /[^\w, ]+/;
    var match = {};
    match.exactSet = {};
    match.matchDict = {};
    match.items = {};
    var computeRatio = function(string1, string2) {

        var ratio = (function(string1, string2) {
            var curr = [];
            var prev;
			var key;

            for (var i = 0; i <= string2.length; i++)
                for (var j = 0; j <= string1.length; j++) {
                    if (i && j)
                        if (string1.charAt(j - 1) === string2.charAt(i - 1))
                            key = prev;
                        else
                            key = Math.min(curr[j], curr[j - 1], prev) + 1;
                    else
                        key = i + j;

                    prev = curr[j];
                    curr[j] = key;
                }
            return curr.pop();
        })(string1, string2);
        if (string1.length > string2.length) {
            return 1 - ratio / string1.length;
        } else {
            return 1 - ratio / string2.length;
        }
    };

    var tokenize = function(key) {
        var purified = '-' + key.toLowerCase().replace(notWord, '') + '-';
		var lenDiff = tokenWeight - purified.length;
        var results = [];
        if (lenDiff > 0) {
            for (var i = 0; i < lenDiff; ++i) {
                key += '-';
            }
        }
        for (var i = 0; i < purified.length - tokenWeight + 1; ++i) {
            results.push(purified.slice(i, i + tokenWeight));
        }
        return results;
    };

    var numTokens = function(key) {
        var result = {};
        var tokens = tokenize(key);
        for (var i = 0; i < tokens.length; ++i) {
            if (tokens[i] in result) {
                result[tokens[i]] += 1;
            } else {
                result[tokens[i]] = 1;
            }
        }
        return result;
    };
    match.find = function(key){
        var result = function(key) {
        var normalizedkey = key.toLowerCase()
        var result = match.exactSet[normalizedkey];
        if (result) {
			//console.log("Matched");
            return "found  " + result ;
        }

        var results;
        for (var tokenWeight = largeChunk; tokenWeight >= smallChunk; --tokenWeight) {
            results = match._find(key, tokenWeight);
            if (results) {
                return results;
            }
        }
        return null;
    } (key);
        if (!result) {
            return "Found no match!";
        }
        return typeof result === "string" ? result : "Do you mean " +result[0][1] + " ?";
    };
	
    match._find = function(key, tokenWeight) {
        var normalizedkey = key.toLowerCase();
		var matches = {};
        var partCounts = numTokens(normalizedkey, tokenWeight);
		var items = this.items[tokenWeight];
		var geom = 0;
		var part;
		var partCount;
		var index;
        var otherpartCount;

        for (part in partCounts) {
            partCount = partCounts[part];
            geom += Math.pow(partCount, 2);
            if (part in this.matchDict) {
                for (var i = 0; i < this.matchDict[part].length; ++i) {
                    index = this.matchDict[part][i][0];
                    otherpartCount = this.matchDict[part][i][1];
                    if (index in matches) {
                        matches[index] += partCount * otherpartCount;
                    } else {
                        matches[index] = partCount * otherpartCount;
                    }
                }
            }
        }

        function isEmptyObject(obj) {
            for (var prop in obj) {
                if (obj.hasOwnProperty(prop))
                    return false;
            }
            return true;
        }

        if (isEmptyObject(matches)) {
            return null;
        }

        var unitVec = Math.sqrt(geom);
		var results = [];
        var matchScore;
        for (var matchIndex in matches) {
            matchScore = matches[matchIndex];
            results.push([matchScore / (unitVec * items[matchIndex][0]), items[matchIndex][1]]);
        }
        var sortDescending = function(a, b) {
            if (a[0] < b[0]) {
                return 1;
            } else if (a[0] > b[0]) {
                return -1;
            } else {
                return 0;
            }
        };
        results.sort(sortDescending);
        var newResults = [];
        var endIndex = Math.min(50, results.length);
        for (var i = 0; i < endIndex; ++i) {
            newResults.push([computeRatio(results[i][1], normalizedkey), results[i][1]]);
        }
        results = newResults;
        results.sort(sortDescending);

        var newResults = [];
        for (var i = 0; i < results.length; ++i) {
            if (results[i][0] == results[0][0]) {
                newResults.push([results[i][0], this.exactSet[results[i][1]]]);
            }
        }
        return newResults;
    };

    match.insert = function(str) {
        var normalizedkey = str.toLowerCase();
        if (normalizedkey in this.exactSet) {
            return false;
        }

        var i = smallChunk;
        for (i; i < largeChunk + 1; ++i) {
            this._insert(str, i);
        }
    };

    match._insert = function(key, tokenWeight) {
        var normalizedkey = key.toLowerCase();
		var items = this.items[tokenWeight] || [];
        var index = items.length;

        items.push(0);
        var partCounts = numTokens(normalizedkey, tokenWeight);
		var geom = 0;
        var part, partCount;
        for (part in partCounts) {
            partCount = partCounts[part];
            geom += Math.pow(partCount, 2);
            if (part in this.matchDict) {
                this.matchDict[part].push([index, partCount]);
            } else {
                this.matchDict[part] = [
                    [index, partCount]
                ];
            }
        }
        var unitVec = Math.sqrt(geom);
        items[index] = [unitVec, normalizedkey];
        this.items[tokenWeight] = items;
        this.exactSet[normalizedkey] = key;
    };
    var i = smallChunk;
    for (i; i < largeChunk + 1; ++i) {
        match.items[i] = [];
    }
    for (i = 0; i < array.length; ++i) {
		if(typeof array[i]!== 'string') throw 'eh';
        match.insert(array[i]);
    }
    return match;
};

module.exports.DoUMean = DoUMean;