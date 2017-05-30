function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function getSum(array) {
  return array.reduce(function(previousValue, currentValue) {
    return previousValue + currentValue;
  });
}

function getFlat(array) {
  return array.reduce(function(a, b) {
    return a.concat(b);
  });
}

function generateExecuteTimes(countOfProccesses) {
  var executeTimes = [];

  for (var i = 0; i < countOfProccesses; i++) {
    executeTimes.push(getRandomInt(5, 20));
  }

  return executeTimes;
}

function parseCustomData(customData, countOfProccesses) {
  var executeTimes = customData.split(',');
  
  if (executeTimes.length != countOfProccesses) {
    throw new Error('Incorrect custom data');
  }

  return executeTimes.map(function (el) {
    return parseInt(el);
  });
}

function calculateGeneralTime(options) {
  
  var additionalExecuteTimes = options.executeTimes.map(function (el) {
    return el + options.additionalCosts;
  });

  var maxAdditionalTime = Math.max.apply(null, additionalExecuteTimes);

  var sumAdditionalTimes = getSum(additionalExecuteTimes);

  var division,
      module;
  if (sumAdditionalTimes <= (options.countOfProccessors * maxAdditionalTime)) {
    
    return sumAdditionalTimes + (options.countOfBlocks - 1) * maxAdditionalTime;
  
  } else {

    module = options.countOfBlocks % options.countOfProccessors;
    division = Math.trunc(options.countOfBlocks / options.countOfProccessors)
    
    if (module == 0) {
  
      return division * sumAdditionalTimes + (options.countOfProccessors - 1) * maxAdditionalTime;
  
    } else {

      return (division + 1) * sumAdditionalTimes + (module - 1) * maxAdditionalTime;

    }
  }
}

function calculateGeneralTimeOfFit(options) {
  var executeTimes = options.fit.map(function (el) {
    return getSum(el);
  });

  var countOfProccesses = executeTimes.length;

  return calculateGeneralTime({
    executeTimes: executeTimes,
    countOfProccesses: countOfProccesses,
    countOfProccessors: options.countOfProccessors,
    countOfBlocks: options.countOfBlocks,
    additionalCosts: options.additionalCosts
  });
}

function nextFit(executeTimes, capacity) {
  var result = [[]],
      executeTime,
      lastContainer;

  result[0].push(executeTimes[0]);

  for (var i = 1; i < executeTimes.length; i++) {
    executeTime = executeTimes[i];
    lastContainer = result[result.length - 1];
    if (getSum(lastContainer) + executeTime <= capacity) {
      lastContainer.push(executeTime);
    } else {
      result.push([executeTime]);
    }
  }

  return result;
}

function performFirstStep(executeTimes) {
  var result = [],
      tempRow,
      tempResult;
  result.push(executeTimes);
  
  for (var i = 0; i < executeTimes.length - 2; i++) {
    tempRow = result[i];
    tempResult = [];
    for (var j = 0; j < executeTimes.length - i - 1; j++) {
      tempResult.push(tempRow[j] + executeTimes[j + i + 1]);
    }

    result.push(tempResult);
  }

  return result;
}

function performSecondStep(executeTable, executeTimes) {
  var sequence = getFlat(executeTable);

  var maxTime = Math.max.apply(null, executeTimes);

  var filteredSequence = sequence.filter(function (el, i, arr) {
    return arr.indexOf(el) === i && el >= maxTime;
  });

  var sortedSequence = filteredSequence.sort();

  return sortedSequence;
}

function performThirdStep(options) {
  var result = {},
      capacity,
      currentFit, tempFit,
      currentLengthFit, tempLengthFit,
      currentLong, tempLong;
  
  angular.merge(result, options);
  result.generalTime = currentLong = calculateGeneralTime(options);
  currentLengthFit = options.countOfProccesses;
  currentFit = options.executeTimes;

  for (var i = 0; i < options.sequence.length; i++) {
    capacity = options.sequence[i];
    tempFit = nextFit(options.executeTimes, capacity);

    tempLengthFit = tempFit.length;

    if (tempLengthFit == currentLengthFit) {
      continue;
    }

    tempLong = calculateGeneralTimeOfFit({
      fit: tempFit,
      countOfProccessors: options.countOfProccessors,
      countOfBlocks: options.countOfBlocks,
      additionalCosts: options.additionalCosts
    });

    if (tempLong < currentLong) {
      currentLong = tempLong;
      currentLengthFit = tempLengthFit;
      currentFit = tempFit;
    }

    if (currentLengthFit <= 2) {
      break;
    }
  }

  result.fit = {};
  result.fit.long = currentLong;
  result.fit.array = currentFit;
  result.fit.length = currentLengthFit;
  result.fit.gain = (100 - result.fit.long / result.generalTime * 100) + "%";

  return result;
}

var app = angular.module("app", []);
app.controller("mainController", function ($scope) {
  // variables
  $scope.inputType = 'auto';
  $scope.executeTimes = [];
  $scope.customData = '';
  
  // logic
  $scope.processPackaging = function () {
    $scope.executeTimes = ($scope.inputType == 'auto')
      ? generateExecuteTimes($scope.countOfProccesses)
      : parseCustomData($scope.customData, $scope.countOfProccesses);

    var executeTable = performFirstStep($scope.executeTimes);

    var sequence = performSecondStep(executeTable, $scope.executeTimes);
    
    $scope.result = performThirdStep({
      executeTimes: $scope.executeTimes,
      countOfProccesses: $scope.countOfProccesses,
      additionalCosts: $scope.additionalCosts,
      countOfProccessors: $scope.countOfProccessors,
      countOfBlocks: $scope.countOfBlocks,
      sequence: sequence
    });
  };
});