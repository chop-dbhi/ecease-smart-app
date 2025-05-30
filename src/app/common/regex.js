const stringRegex = /\w+/;
var isValidString = (v) => stringRegex.test(v);

const phoneRegex = /\(\d{3}\)\s\d{3}-\d{4}/;
var isValidPhone = (v) => phoneRegex.test(v);

const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
var isValidDate = (v) => {
    if (dateRegex.test(v)) {
        var d = new Date(v);
        if (d instanceof Date && !isNaN(d)) {
            return true;
        }
    }
    return false;
};

export {
    isValidString,
    isValidPhone,
    isValidDate
};