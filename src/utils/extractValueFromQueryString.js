

const extractIntParam = (req,name) => {
    if (!req.body || req.body[name] === undefined) {
        return undefined;
    }

    const nameValue = parseInt(req.body[name]);
    return isNaN(nameValue) ? undefined : nameValue;
};

const extractParam = (req, name, defaultValue = undefined) => {
    const key = Object.keys(req.body).find(x => x.toLowerCase() === name.toLowerCase());
    return key ? req.body[key] : defaultValue;
};

module.exports = {
    extractIntParam,
    extractParam
}