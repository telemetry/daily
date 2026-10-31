package com.telemetry.a2uiwestpac.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.lerp
import androidx.compose.ui.unit.sp

/**
 * Which design system the Material 3 components wear. The A2UI stream is the
 * same either way; only the theme (and one overridden catalog slot) changes.
 */
enum class Skin { Westpac, Baseline }

val LocalSkin = compositionLocalOf { Skin.Westpac }

/**
 * Material 3 colour roles expressed in GEL. Every role points at a GEL semantic
 * token (see GelWbc.kt, generated from `@westpac/style-config`); nothing is
 * re-coloured by hand, so when GEL moves, this scheme moves with it.
 *
 * GEL "primary" is Westpac red, "hero" the deep navy that carries most of the
 * brand's weight, and "holler" is reserved for focus.
 */
private val WestpacLight: ColorScheme = lightColorScheme(
    primary = GelWbc.surfacePrimary,
    onPrimary = GelWbc.textMono,
    primaryContainer = GelWbc.surfacePrimaryFaint,
    onPrimaryContainer = GelWbc.Primitive.wbcPrimary900,
    secondary = GelWbc.surfaceHero,
    onSecondary = GelWbc.textMono,
    secondaryContainer = GelWbc.surfaceHeroFaint,
    onSecondaryContainer = GelWbc.Primitive.wbcHero900,
    tertiary = GelWbc.surfaceHoller,
    onTertiary = GelWbc.textMono,
    tertiaryContainer = GelWbc.surfaceHollerFaint,
    onTertiaryContainer = GelWbc.Primitive.wbcHoller900,
    error = GelWbc.surfaceDanger,
    onError = GelWbc.textMono,
    errorContainer = GelWbc.surfaceDangerFaint,
    onErrorContainer = GelWbc.Primitive.reservedDanger900,
    background = GelWbc.backgroundWhite,
    onBackground = GelWbc.textBody,
    surface = GelWbc.surfaceMono,
    onSurface = GelWbc.textBody,
    surfaceVariant = GelWbc.surfaceMutedPale,
    onSurfaceVariant = GelWbc.Primitive.wbcMuted600,
    outline = GelWbc.borderMutedStrong,
    outlineVariant = GelWbc.borderMutedSoft,
    inverseSurface = GelWbc.surfaceMutedVivid,
    inverseOnSurface = GelWbc.surfaceMutedFaint,
    inversePrimary = GelWbc.Primitive.wbcPrimary200,
    surfaceTint = GelWbc.surfacePrimary,
    scrim = GelWbc.Primitive.monoBlack,
    surfaceDim = GelWbc.surfaceMutedSoft,
    surfaceBright = GelWbc.surfaceMono,
    surfaceContainerLowest = GelWbc.surfaceMono,
    surfaceContainerLow = GelWbc.surfaceMutedFaint,
    surfaceContainer = GelWbc.surfaceMutedPale,
    surfaceContainerHigh = lerp(GelWbc.surfaceMutedPale, GelWbc.surfaceMutedSoft, 0.45f),
    surfaceContainerHighest = GelWbc.surfaceMutedSoft,
)

/**
 * GEL-next ships light mode only. This scheme is derived from the same
 * primitives rather than taken from the system: read it as a proposal.
 */
private val WestpacDark: ColorScheme = darkColorScheme(
    primary = GelWbc.Primitive.wbcPrimary300,
    onPrimary = GelWbc.Primitive.wbcPrimary950,
    primaryContainer = GelWbc.Primitive.wbcPrimary800,
    onPrimaryContainer = GelWbc.Primitive.wbcPrimary100,
    secondary = GelWbc.Primitive.wbcHero200,
    onSecondary = GelWbc.Primitive.wbcHero900,
    secondaryContainer = GelWbc.Primitive.wbcHero700,
    onSecondaryContainer = GelWbc.Primitive.wbcHero100,
    tertiary = GelWbc.Primitive.wbcHoller200,
    onTertiary = GelWbc.Primitive.wbcHoller900,
    tertiaryContainer = GelWbc.Primitive.wbcHoller800,
    onTertiaryContainer = GelWbc.Primitive.wbcHoller100,
    error = GelWbc.Primitive.reservedDanger300,
    onError = GelWbc.Primitive.reservedDanger950,
    errorContainer = GelWbc.Primitive.reservedDanger800,
    onErrorContainer = GelWbc.Primitive.reservedDanger100,
    background = GelWbc.Primitive.wbcMuted950,
    onBackground = GelWbc.Primitive.wbcMuted100,
    surface = GelWbc.Primitive.wbcMuted950,
    onSurface = GelWbc.Primitive.wbcMuted100,
    surfaceVariant = GelWbc.Primitive.wbcMuted800,
    onSurfaceVariant = GelWbc.Primitive.wbcMuted300,
    outline = GelWbc.Primitive.wbcMuted500,
    outlineVariant = GelWbc.Primitive.wbcMuted700,
    inverseSurface = GelWbc.Primitive.wbcMuted100,
    inverseOnSurface = GelWbc.Primitive.wbcMuted900,
    inversePrimary = GelWbc.Primitive.wbcPrimary500,
    surfaceTint = GelWbc.Primitive.wbcPrimary300,
    scrim = GelWbc.Primitive.monoBlack,
    surfaceDim = GelWbc.Primitive.wbcMuted950,
    surfaceBright = GelWbc.Primitive.wbcMuted800,
    surfaceContainerLowest = GelWbc.Primitive.monoBlack,
    surfaceContainerLow = GelWbc.Primitive.wbcMuted900,
    surfaceContainer = lerp(GelWbc.Primitive.wbcMuted900, GelWbc.Primitive.wbcMuted800, 0.5f),
    surfaceContainerHigh = GelWbc.Primitive.wbcMuted800,
    surfaceContainerHighest = GelWbc.Primitive.wbcMuted700,
)

/** GEL is squarer than Material: buttons sit at 3dp, panels at 8dp. */
private val WestpacShapes = Shapes(
    extraSmall = RoundedCornerShape(GelWbc.radiusSm),
    small = RoundedCornerShape(GelWbc.radiusMd),
    medium = RoundedCornerShape(GelWbc.radius2xl),
    large = RoundedCornerShape(GelWbc.radius3xl),
    extraLarge = RoundedCornerShape(GelWbc.radius4xl),
)

/**
 * GEL sets headings in the brand face and in "hero" navy. The Westpac typeface
 * is licensed and not shipped, so only the colour is applied; the system face
 * (Roboto) is the honest fallback, as GEL's own CSS also falls back to the
 * system stack.
 */
private fun westpacTypography(headingColor: Color): Typography {
    val base = Typography()
    return base.copy(
        displayLarge = base.displayLarge.copy(color = headingColor),
        displayMedium = base.displayMedium.copy(color = headingColor),
        displaySmall = base.displaySmall.copy(color = headingColor),
        headlineLarge = base.headlineLarge.copy(color = headingColor, letterSpacing = (-0.3).sp),
        headlineMedium = base.headlineMedium.copy(color = headingColor, letterSpacing = (-0.2).sp),
        headlineSmall = base.headlineSmall.copy(color = headingColor),
        titleLarge = base.titleLarge.copy(color = headingColor),
        titleMedium = base.titleMedium.copy(color = headingColor),
    )
}

@Composable
fun WestpacTheme(skin: Skin, dark: Boolean, content: @Composable () -> Unit) {
    val colorScheme = when (skin) {
        Skin.Baseline -> if (dark) darkColorScheme() else lightColorScheme()
        Skin.Westpac -> if (dark) WestpacDark else WestpacLight
    }
    val shapes = if (skin == Skin.Baseline) Shapes() else WestpacShapes
    val typography = when (skin) {
        Skin.Baseline -> Typography()
        Skin.Westpac -> westpacTypography(if (dark) GelWbc.Primitive.wbcHero200 else GelWbc.textHeading)
    }
    androidx.compose.runtime.CompositionLocalProvider(LocalSkin provides skin) {
        MaterialTheme(colorScheme = colorScheme, shapes = shapes, typography = typography, content = content)
    }
}
