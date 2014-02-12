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
        { control: "border", border: "White", borderthickness: "5", contents: [
            { control: "scrollview", orientation: "Horizontal", height: 150, width: 150, contents: [
                { control: "image", height: 300, width: 300, resource: "{image}" },
            ] },
        ] },

        /*
        { control: "canvas", height: 150, contents: [
            { control: "image", top: 0, left: 0, resource: "{image}" },
        ] },
        { control: "button", caption: "Switch images", margin: "{fontSize}", binding: "switchImages" },
        */

        { control: "slider", minimum: 10, maximum: 50, binding: "fontSize", width: 400 },
        { control: "text", value: "Heading to be sized", fontsize: "{fontSize}" },
        { control: "slider", minimum: 10, maximum: 50, binding: "fontSize", width: 400 },

        { control: "text", value: "{$parent.$parent.caption}: {$data}", fontsize: 12, binding: { foreach: "colors", with: "color" } },
        { control: "edit", fontsize: 12, binding: { foreach: "colors", value: "color" } },
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
            { name: "Red", color: "red", value: "0xff0000" }, { name: "Green", color: "green", value: "0x00ff00" }, { name: "Blue", color: "blue", value: "0x0000ff" },
        ],
        selection: { name: "Green", color: "green", value: "0x00ff00" },
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
