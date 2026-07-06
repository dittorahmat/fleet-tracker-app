## 1. Edit Vehicle REST API

- [x] 1.1 Add the `PUT /api/vehicles/:id` REST API route in Hono `index.ts`.
- [x] 1.2 Implement SQL update statements to update vehicle record name in the database.

## 2. Power Cut Alarm Parser

- [x] 2.1 Update the GPRS GT06 parser in `db/gt06Parser.ts` to decode GPRS binary power cut alarms and text `alarm:power_cut` messages.
- [x] 2.2 Update TCP Server socket receiver logic to generate and log critical alerts of type `power_cut` into the database and broadcast via SSE.

## 3. UI Implementation

- [x] 3.1 Add an edit name inline/modal trigger button next to the vehicle name in `App.tsx`.
- [x] 3.2 Implement API call hook to `PUT /api/vehicles/:id` to save name updates from the frontend.
- [x] 3.3 Modify toast notification component in the dashboard to render a critical flashing red alarm indicator for power cut alerts.
