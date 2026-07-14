import 'package:flutter_test/flutter_test.dart';
import 'package:smart_expense_tracker_mobile/main.dart';

void main() {
  testWidgets('App initialization smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const MyApp());

    // Verify that Splash screen displays application title.
    expect(find.text('Smart Tracker'), findsOneWidget);

    // Let the splash timer finish to avoid "Timer still pending" assertions
    await tester.pump(const Duration(seconds: 3));
  });
}
