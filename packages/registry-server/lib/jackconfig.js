
exports.app = function(env)
{
    return require("server", "registry-server").app(env);
}

exports.development = function(app)
{
    return function(env) {
        return require("jack/reloader").Reloader(module.id, "app")(env);
    };
}
