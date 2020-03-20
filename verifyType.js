const getConstructor = value => value === null ? "null" : value === undefined ? "undefined" : value.constructor.name;
function verifyConfig(config, propertyName, fallback, required = false) {
  if (!config.hasOwnProperty(propertyName)) {
    if (required) throw new Error(`config.${propertyName} is required`);
    else return fallback;
  }
  else return verify(config[propertyName], fallback, `config.${propertyName}`, required);
}
function verify(value, fallback, valueName = "<value>", required = true) {
  if (required && fallback instanceof constructor) {
    try {
      fallback = new fallback();
    }
    catch (err) {
      fallback = fallback();
    }
  }
  const useFallback = err => {
    if (required) throw err;
    else {
      console.warn(`\x1b[33m${valueName} should be type ${getConstructor(fallback)}, but type ${getConstructor(value)} was recieved. ${valueName} defaulted to ${fallback}\x1b[0m`);
      return fallback;
    }
  };
  if (value == null || fallback == null) { // if either is null or undefined
    if (value === fallback) return value;
    else return useFallback(new Error(`${valueName} must be of type ${getConstructor(fallback)}, received type ${getConstructor(value)}`));
  }
  else if (value.constructor === Number && fallback.constructor === Number) {
    if (isNaN(value) === isNaN(fallback)) return value;
    else if (isNaN(value)) return useFallback(new Error(`${valueName} is NaN`));
    else if (isNaN(fallback)) return useFallback(new Error(`${valueName} must be NaN`));
  }
  else if (value instanceof Object && fallback instanceof Object) {
    if (value instanceof fallback.constructor) return value;
    else return useFallback(new Error(`${valueName} must be of type ${fallback.constructor.name}, received type ${value.constructor.name}`));
  }
  else if (value.constructor === fallback.constructor) return value;
  else return useFallback(new Error(`${valueName} must be of type ${fallback.constructor.name}, received type ${value.constructor.name}`));
}
verify.config = verifyConfig;
module.exports = verify;
