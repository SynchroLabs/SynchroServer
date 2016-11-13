---
title: Location Control
description: Non-visible (non-layout) control for providing location services
---

{{ page.description }}

## Attributes:

* `movementThreshold` (in meters, to trigger location update, default is 100)

## Bindings:

* `value`
* `sync`
* `onUpdate` (command + params)

## Bound value output

### Location Data

    {
        available: true,
        status: "Active",
        coordinate:
        {
            latitude: 47.1234567,
            longitude: -122.123456
        },
        accuracy: 5,       // in meters
        heading: 45.1234,  // in degrees
        speed: 1.23        // in meters/second
    }

`status`:

* `DeterminingAvailabily` - The system is determining the availability of location services
* `Available` - Location services are available and a location update will be provided when available
* `NotAvailable` - Location services are not available, and no user action can make them available
* `PendingApproval` - Location service availability is pending response from the user for approval
* `NotApproved` - Access to location service has not been approved by the user for this application
* `Active` - A location has been provided, and future updates my occur based on `movementThreshold`
* `Failed` - Location support is available, but the more recent attempt to determine location failed

`available`:

This value will be set to true if location services are available and approved, and your application should expect location updates. Typically
this will mean that the status is one of `Available`, `Active`, or `Failed`. This member is provided as a convenience to avoid having to do more
sophisticated analysis of `status`.

## Examples:

Simple location control that updates local view model.

    { control: "location", binding: "myLoc", movementThreshold: 500 }

Location control that updates location in view model on server on every location change.

    { control: "location", binding: { value: "myLoc", sync: "change" } }

Location control that calls a command function on the server every time the location changes.

    { control: "location", binding: { value: "myLoc", onUpdate: { command: "setPos", pos: "{myLoc.coordinate}" } }

Location control and button that passes location via command when pressed. Button is shown only if location services are present, and enabled
only if a location has been established.

    { control: "location", binding: "myLoc" },
    { 
      control: "button", caption: "Use location", visibility: "{myLoc.available}", enabled: "{myLoc.coordinate}", 
      binding: { command: "doLocationSearch", location: "{myLoc.coordinate}" } 
    }
