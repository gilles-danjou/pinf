
exports.app = function(env)
{
    env.environment = env.environment || "none";
    return require("server", "registry-server").app(env);
}

exports.development = function(app)
{
    return function(env) {
        env.environment = "development";
        return require("jack/reloader").Reloader(module.id, "app")(env);
    };
}
