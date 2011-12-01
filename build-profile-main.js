({
    appDir: "src",
    baseUrl: "scripts",
    dir: "build/ipov-wbt",

    /*
    optimize: "closure",
    closure: {
        CompilerOptions: {},
        CompilationLevel: 'WHITESPACE_ONLY',
        loggingLevel: 'WARNING'
    },
    */

    //Inlines the text for any text! dependencies, to avoid the separate
    //async XMLHttpRequest calls to load those dependencies.
    inlineText: true,

    // Map the name 'jquery' to the correct file
    paths: {
        "jquery": "require-jquery"
    },

    modules: [
        {
            name: "wbt-main",
            include: ["jsrender", "swfobject", "net_ipov/wbt/cr", "net_ipov/wbt/jsrender-tags"],
            exclude: ["jquery", "amplify.store"]		// jquery is already baked in,  the theme code needs to be a separate module
        },
        {
        	name: "themes/silearn/theme",
        	exclude: ["jquery", "amplify.store", "wbt-main"]
        }
    ],

    fileExclusionRegExp: /^\.|^tests$|^site$/
})