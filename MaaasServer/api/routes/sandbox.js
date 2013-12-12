// Sandbox page
//
var tddLogo = "resources/tdd.png";
var profileImage = "http://fbcdn-profile-a.akamaihd.net/hprofile-ak-ash3/c23.23.285.285/s160x160/943786_10201215910308278_1343091684_n.jpg";

exports.View =
{
    title: "Sandbox",
    onBack: "exit",
    elements:
    [
        { type: "image", resource: "{image}" },
        { type: "button", caption: "Switch images", binding: "switchImages" },

        { type: "slider", minimum: 10, maximum: 50, binding: "fontSize", width: 200 },
        { type: "text", value: "Heading to be sized", fontsize: "{fontSize}" },
        { type: "slider", minimum: 10, maximum: 50, binding: "fontSize", width: 200 },

        { type: "text", value: "{$root.caption}: {color}", fontsize: 24, binding: { foreach: "colors" } },
        { type: "edit", fontsize: 24, binding: { foreach: "colors", value: "color" } },
    ]
}

exports.InitializeViewModel = function(context, session)
{
    var viewModel =
    {
        fontSize: 24,
        caption: "The Color",
        colors:
        [
            { color: "red", value: "0xff0000" }, { color: "green", value: "0x00ff00" }, { color: "blue", value: "0x0000ff" },
        ],
        selection: { color: "green", value: "0x00ff00" },
        image: profileImage,
    }
    return viewModel;
}

exports.Commands =
{
    switchImages: function(context, session, viewModel)
    {
        if (viewModel.image == tddLogo)
        {
            viewModel.image = profileImage;
        }
        else
        {
            viewModel.image = tddLogo;
        }
    },
    exit: function(context)
    {
        return navigateToView(context, "menu");
    },
}
