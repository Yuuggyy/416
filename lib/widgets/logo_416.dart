import 'package:flutter/material.dart';

class Logo416Widget extends StatelessWidget {
  final double size;
  final bool showText;
  final bool enableGlow;

  const Logo416Widget({
    super.key,
    this.size = 40,
    this.showText = true,
    this.enableGlow = true,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: size,
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: enableGlow
          ? BoxDecoration(
              borderRadius: BorderRadius.circular(8),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF9333EA).withOpacity(0.3),
                  blurRadius: 12,
                  spreadRadius: 1,
                ),
              ],
            )
          : null,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Graphic 41R Custom Painted Logo Icon
          SizedBox(
            width: size * 0.9,
            height: size * 0.9,
            child: CustomPaint(
              painter: _Logo416Painter(),
            ),
          ),
          if (showText) ...[
            const SizedBox(width: 8),
            Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                RichText(
                  text: TextSpan(
                    style: TextStyle(
                      fontFamily: 'sans-serif',
                      fontWeight: FontWeight.w900,
                      fontSize: size * 0.42,
                      letterSpacing: 1.2,
                    ),
                    children: const [
                      TextSpan(
                        text: '416 ',
                        style: TextStyle(
                          color: Color(0xFFA855F7), // Neon Purple
                          shadows: [
                            Shadow(color: Color(0xFF9333EA), blurRadius: 8),
                          ],
                        ),
                      ),
                      TextSpan(
                        text: 'RECORDS',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ],
                  ),
                ),
                Text(
                  'MAISON DE PRODUCTION',
                  style: TextStyle(
                    color: const Color(0xFF94A3B8),
                    fontSize: size * 0.18,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.8,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _Logo416Painter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // White Street Graffiti Font Paint for "41R"
    final whitePaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    // 1. Draw "4" left side stroke
    Path path4 = Path()
      ..moveTo(w * 0.2, h * 0.2)
      ..lineTo(w * 0.08, h * 0.6)
      ..lineTo(w * 0.35, h * 0.6)
      ..lineTo(w * 0.35, h * 0.2)
      ..lineTo(w * 0.25, h * 0.2)
      ..lineTo(w * 0.25, h * 0.5)
      ..lineTo(w * 0.18, h * 0.5)
      ..close();
    canvas.drawPath(path4, whitePaint);

    // Vertical line of 4
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(w * 0.28, h * 0.2, w * 0.08, h * 0.62),
        const Radius.circular(2),
      ),
      whitePaint,
    );

    // Drip under "4"
    Path drip1 = Path()
      ..moveTo(w * 0.29, h * 0.82)
      ..quadraticBezierTo(w * 0.3, h * 0.9, w * 0.3, h * 0.95)
      ..quadraticBezierTo(w * 0.31, h * 0.9, w * 0.33, h * 0.82)
      ..close();
    canvas.drawPath(drip1, whitePaint);

    // 2. Main Stem 'R' (White rectangle block with purple numbers 4, 1, 6 inside)
    final rStemRect = RRect.fromRectAndRadius(
      Rect.fromLTWH(w * 0.42, h * 0.15, w * 0.16, h * 0.68),
      const Radius.circular(3),
    );
    canvas.drawRRect(rStemRect, whitePaint);

    // Big Drip tail under 'R' stem
    Path dripR = Path()
      ..moveTo(w * 0.44, h * 0.83)
      ..lineTo(w * 0.44, h * 0.98)
      ..quadraticBezierTo(w * 0.47, h * 1.05, w * 0.50, h * 0.98)
      ..lineTo(w * 0.50, h * 0.83)
      ..close();
    canvas.drawPath(dripR, whitePaint);

    // 'R' loop top
    Path rLoop = Path()
      ..moveTo(w * 0.58, h * 0.15)
      ..cubicTo(w * 0.85, h * 0.15, w * 0.85, h * 0.52, w * 0.58, h * 0.52)
      ..lineTo(w * 0.58, h * 0.36)
      ..cubicTo(w * 0.72, h * 0.36, w * 0.72, h * 0.28, w * 0.58, h * 0.28)
      ..close();
    canvas.drawPath(rLoop, whitePaint);

    // 'R' diagonal leg right
    Path rLeg = Path()
      ..moveTo(w * 0.55, h * 0.48)
      ..lineTo(w * 0.82, h * 0.85)
      ..lineTo(w * 0.92, h * 0.85)
      ..lineTo(w * 0.65, h * 0.48)
      ..close();
    canvas.drawPath(rLeg, whitePaint);

    // 3. Stacked Purple Numbers 4 1 6 inside R stem
    final textPainter = TextPainter(
      textDirection: TextDirection.ltr,
    );

    const purpleStyle = TextStyle(
      color: Color(0xFF9333EA),
      fontWeight: FontWeight.w900,
      fontSize: 8,
    );

    // 4
    textPainter.text = const TextSpan(text: '4', style: purpleStyle);
    textPainter.layout();
    textPainter.paint(canvas, Offset(w * 0.46, h * 0.20));

    // 1
    textPainter.text = const TextSpan(text: '1', style: purpleStyle);
    textPainter.layout();
    textPainter.paint(canvas, Offset(w * 0.47, h * 0.42));

    // 6
    textPainter.text = const TextSpan(text: '6', style: purpleStyle);
    textPainter.layout();
    textPainter.paint(canvas, Offset(w * 0.46, h * 0.64));
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
