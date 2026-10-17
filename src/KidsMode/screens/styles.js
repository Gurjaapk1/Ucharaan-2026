// Kids Mode colours from the Uchaaran designs, which were drawn from this app's light and dark themes.
const palette = (dark) =>
  dark
    ? {
        secondary: "#b7bdc6",
        subtle: "#232323",
        action: "#121F35",
        retry: "#3d2523",
        retryText: "#f4b4ab",
      }
    : {
        secondary: "#666666",
        subtle: "#faf9f6",
        action: "#D3E1F7",
        retry: "#fbe9e4",
        retryText: "#9c382c",
      };

// Baloo Paaji 2 needs about 1.78x its size so Gurmukhi vowel signs are not clipped on iOS.
const gurmukhiLine = (size) => Math.round(size * 1.78);

const createStyles = (theme) => {
  const kids = palette(theme.mode === "dark");
  const { colors, spacing, typography } = theme;
  const bold = typography.fonts.balooPaajiSemiBold;
  return {
    pad: { padding: spacing.xl_20, gap: spacing.md_12 },
    heading: { fontFamily: bold, fontSize: typography.sizes.xxxl, color: colors.primaryText },
    body: { fontSize: typography.sizes.lg, color: colors.primaryText },
    small: { fontSize: typography.sizes.md, color: kids.secondary },
    button: {
      minHeight: 48,
      paddingVertical: 10,
      paddingHorizontal: spacing.lg,
      borderRadius: 10,
      justifyContent: "center",
      backgroundColor: colors.primary,
    },
    buttonSecondary: { backgroundColor: kids.action },
    buttonFaded: { opacity: 0.4 },
    buttonText: {
      fontFamily: bold,
      fontSize: typography.sizes.lg,
      color: "#faf9f6",
      textAlign: "center",
    },
    buttonTextSecondary: { color: colors.primaryText },
    stars: { flexDirection: "row", gap: 2, alignItems: "center" },
    star: { fontSize: 17 },
    starLarge: { fontSize: 38 },
    starOn: { color: "#cba51e" },
    starOff: { color: "#a1a9b2" },
    section: {
      paddingHorizontal: spacing.lg,
      paddingVertical: 7,
      backgroundColor: kids.subtle,
      borderColor: colors.separator,
      borderTopWidth: 1,
      borderBottomWidth: 1,
    },
    sectionTitle: { fontFamily: bold, fontSize: typography.sizes.xl, color: colors.primaryText },
    nodes: { flexDirection: "row", flexWrap: "wrap", gap: spacing.lg, padding: spacing.lg },
    node: { alignItems: "center", width: 60, gap: spacing.sm },
    nodeDisc: {
      width: 47,
      height: 47,
      borderRadius: 24,
      borderWidth: 4,
      borderColor: "#ffffff",
      backgroundColor: "#ffffff",
      alignItems: "center",
      justifyContent: "center",
      elevation: 3,
    },
    nodeDone: { backgroundColor: "#426a46" },
    nodeLocked: { opacity: 0.45 },
    nodeText: { fontFamily: bold, fontSize: 23, color: colors.primary },
    nodeTextDone: { color: "#ffffff" },
    line: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    word: { alignItems: "center", paddingHorizontal: spacing.sm, borderRadius: 6 },
    wordActive: { backgroundColor: kids.action },
    gurmukhi: { fontSize: 27, lineHeight: gurmukhiLine(27), color: colors.primaryText },
    translit: { fontSize: typography.sizes.md, color: kids.secondary },
    controls: {
      padding: spacing.lg,
      gap: spacing.md,
      borderTopWidth: 1,
      borderColor: colors.separator,
      backgroundColor: colors.surface,
    },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
    chip: {
      minHeight: 44,
      justifyContent: "center",
      borderWidth: 1,
      borderRadius: 16,
      paddingHorizontal: spacing.md_12,
      borderColor: colors.separator,
    },
    chipSelected: { backgroundColor: kids.action, borderColor: colors.primary },
    row: { flexDirection: "row", alignItems: "center", gap: spacing.md_12 },
    grow: { flex: 1 },
    center: { alignItems: "center", gap: spacing.md },
    score: {
      fontFamily: bold,
      fontSize: 44,
      lineHeight: gurmukhiLine(44),
      color: colors.primaryText,
    },
    info: { padding: spacing.lg, borderRadius: 10, gap: spacing.md, backgroundColor: kids.action },
    retryBox: { backgroundColor: kids.retry },
    retryText: { color: kids.retryText },
    wordCheck: {
      color: kids.retryText,
      backgroundColor: kids.retry,
      textDecorationLine: "underline",
    },
    wordUnclear: { color: kids.secondary, opacity: 0.5 },
    entry: { position: "absolute", bottom: spacing.md, left: spacing.sm },
  };
};
export default createStyles;
