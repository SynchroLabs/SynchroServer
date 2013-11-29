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

        { type: "text", value: "{$parent.$parent.$parent.caption}: {color}", fontsize: 24, binding: { foreach: "colors" } },
        { type: "edit", fontsize: 24, binding: { foreach: "colors", value: "color" } },
    ]
}

exports.InitializeViewModelState = function(context, session)
{
    var vmState =
    {
        fontSize: 24,
        caption: "The Color",
        colors:
        [
            { color: "red" }, { color: "green" }, { color: "blue" },
        ],
        image: profileImage,
    }
    return vmState;
}

exports.Commands =
{
    switchImages: function (context, session, vmState)
    {
        if (vmState.image == tddLogo)
        {
            vmState.image = profileImage;
        }
        else
        {
            vmState.image = tddLogo;
        }
    },
    exit: function(context)
    {
        return navigateToView(context, "menu");
    },
}
