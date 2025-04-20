# AutoFill Application To-Do List

## Critical Issues
1. **Database Connection Errors**: 
   - Fix "terminating connection due to administrator command" errors with Neon PostgreSQL
   - Consider implementing connection pooling retry logic in `server/db.ts`
   - Investigate the use of two separate pg pools (one in db.ts, one in storage.ts)
   - Add proper error handling for database connection failures

2. **Authentication System**: 
   - Resolve 401/403 Unauthorized errors during page navigation
   - Review the session configuration in storage.ts
   - Ensure cookies are being properly set and maintained across page reloads

## User Interface Issues
1. **Blank Pages**: Fix pages that display as completely blank (admin pages, possibly others)
2. **Homepage Map**: Add/fix Google Maps implementation on homepage
3. **Vehicle Dropdown**: Add more vehicle options to the dropdown menu for adding vehicles
4. **Add New Location Form**: Ensure entered locations aren't overridden by API location service

## Mobile App TypeScript Issues
1. **Component Type Errors**: Fix React Native component type errors in HomeScreen.tsx
   - Resolve incompatible component types (SafeAreaView, ActivityIndicator, Text, etc.)
2. **Navigation Type Errors**: Fix property 'navigate' type errors in mobile navigation
3. **Testing Framework Issues**: Fix Jest-related errors in test files
   - Add proper Jest type definitions and setup files

## Code Quality Issues
1. **TypeScript Errors**: Fix type errors in shared/utils/common.ts
2. **Client-side Type Errors**: Resolve property 'id' errors in order-page.tsx
3. **Test Utility Errors**: Address module import and type errors in test utilities

## Admin Dashboard Issues
1. **Admin Authentication**: Fix login and access to admin dashboard
2. **Admin Dashboard Rendering**: Ensure all admin pages render correctly
3. **Order Price Conversion**: Confirm proper conversion between cents (database) and dollars (UI)

## Feature Enhancements
1. **Map Integration**: Fully implement Google Maps integration for location selection
2. **Location Page**: Ensure address information is complete and accurate in saved locations
3. **WebSocket Connection**: Fix WebSocket connection failures
4. **Error States**: Implement better error handling and user feedback

## To Be Assessed
- Payment methods page functionality 
- Account settings page
- Emergency fuel request flow
- Customer data management in admin interface
- Driver management in admin interface
- Order assignment functionality