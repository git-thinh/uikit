import {assign, hasOwn, includes, isArray, isFunction, isUndefined, startsWith} from './lang';

const strats = {};

// concat strategy
strats.args =
strats.events =
strats.init =
strats.created =
strats.beforeConnect =
strats.connected =
strats.ready =
strats.beforeDisconnect =
strats.disconnected =
strats.destroy = function (parentVal, childVal) {

    parentVal = parentVal && !isArray(parentVal) ? [parentVal] : parentVal;

    return childVal
        ? parentVal
            ? parentVal.concat(childVal)
            : isArray(childVal)
                ? childVal
                : [childVal]
        : parentVal;
};

// update strategy
strats.update = function (parentVal, childVal) {
    return strats.args(parentVal, isFunction(childVal) ? {read: childVal} : childVal);
};

// property strategy
strats.props = function (parentVal, childVal) {

    if (isArray(childVal)) {
        childVal = childVal.reduce((value, key) => {
            value[key] = String;
            return value;
        }, {});
    }

    return strats.methods(parentVal, childVal);
};

// extend strategy
strats.computed =
strats.defaults =
strats.methods = function (parentVal, childVal) {
    return childVal
        ? parentVal
            ? assign({}, parentVal, childVal)
            : childVal
        : parentVal;
};

// default strategy
const defaultStrat = function (parentVal, childVal) {
    return isUndefined(childVal) ? parentVal : childVal;
};

export function mergeOptions(parent, child) {

    const options = {};

    if (isFunction(child)) {
        child = child.options;
    }

    if (child.extends) {
        parent = mergeOptions(parent, child.extends);
    }

    if (child.mixins) {
        for (let i = 0, l = child.mixins.length; i < l; i++) {
            parent = mergeOptions(parent, child.mixins[i]);
        }
    }

    for (const key in parent) {
        mergeKey(key);
    }

    for (const key in child) {
        if (!hasOwn(parent, key)) {
            mergeKey(key);
        }
    }

    function mergeKey(key) {
        options[key] = (strats[key] || defaultStrat)(parent[key], child[key]);
    }

    return options;
}

export function parseOptions(options, args = []) {

    try {

        return !options
            ? {}
            : startsWith(options, '{')
                ? JSON.parse(options)
                : args.length && !includes(options, ':')
                    ? ({[args[0]]: options})
                    : options.split(';').reduce((options, option) => {
                        const [key, value] = option.split(/:(.*)/);
                        if (key && !isUndefined(value)) {
                            options[key.trim()] = value.trim();
                        }
                        return options;
                    }, {});

    } catch (e) {
        return {};
    }

}
