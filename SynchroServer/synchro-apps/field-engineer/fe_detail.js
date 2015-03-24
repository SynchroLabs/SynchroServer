// Field Engineer - Job Details page
//
exports.View =
{
    title: "Job Details",
    elements: 
    [
        { control: "stackpanel", width: "*", contents: [
            { control: "stackpanel", orientation: "Horizontal", width: "*", background: "{job.Color}", padding: 10, margin: { bottom: 10 }, contents: [
                { control: "text", value: "{job.JobNumber}", font: { bold: true, size: 10 }, margin: 0 },
                { control: "text", value: "{job.EtaTime}", fontsize: 10, margin: { left: 10, right: 0, top: 0, bottom: 0 } },
            ] },
            { control: "stackpanel", orientation: "Horizontal", width: "*", padding: 10, margin: 0, contents: [
                { control: "text", value: "Description:", font: { bold: true, size: 8 } },
                { control: "text", value: "{job.Title}", width: "*", textAlignment: "Right", fontsize: 8 },
            ] },
            { control: "stackpanel", orientation: "Horizontal", width: "*", padding: 10, margin: 0, contents: [
                { control: "text", value: "Customer:", font: { bold: true, size: 8 } },
                { control: "text", value: "{job.FullName}", width: "*", textAlignment: "Right", fontsize: 8 },
            ] },
            { control: "stackpanel", orientation: "Horizontal", width: "*", padding: 10, margin: 0, contents: [
                { control: "text", value: "Address:", font: { bold: true, size: 8 } },
                { control: "stackpanel", orientation: "Vertical", width: "*", padding: 0, margin: 0, contents: [
                    { control: "text", value: "{job.HouseNumberOrName} {job.Street}", width: "*", textAlignment: "Right", fontsize: 8 },
                    { control: "text", value: "{job.Town} {job.Postcode}", width: "*", textAlignment: "Right", fontsize: 8 },
                ] },
            ] },
            { control: "stackpanel", orientation: "Horizontal", width: "*", padding: 10, margin: 0, contents: [
                { control: "text", value: "Telephone:", font: { bold: true, size: 8 } },
                { control: "text", value: "{job.PrimaryContactNumber}", width: "*", textAlignment: "Right", fontsize: 8 },
            ] },
            { control: "stackpanel", orientation: "Horizontal", width: "*", padding: 10, margin:0, contents: [
                { control: "text", value: "Status:", font: { bold: true, size: 8 } },
                { control: "text", value: "{job.Status}", width: "*", textAlignment: "Right", fontsize: 8 },
            ] },
            { control: "button", caption: "Mark Job as Complete", binding: "markJobComplete", margin: { left: 20 } },
        ] },

    ]
}

exports.InitializeViewModel = function(context, session, params)
{
    var viewModel =
    {
        job: params.job,
    }
    return viewModel;
}

exports.Commands = 
{
    markJobComplete: function(context, session, viewModel, params)
    {
        // !!! TODO
    },
}