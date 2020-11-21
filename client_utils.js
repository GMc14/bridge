function rotate($el, degrees, yTans = 0) {
  $el.css({
      'transform': 'rotate(' + degrees + 'deg) translateY('+yTans+'px)',
      'zoom': 1
  });
}

const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
};

function noNulls(arr){
	for (var j=0; j<arr.length; j++) {
		if(arr[j] == null) {return false;}
	}
	return true;
}