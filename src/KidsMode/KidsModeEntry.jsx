import React from "react";
import { Pressable } from "react-native";
import { useSelector } from "react-redux";
import { Icon } from "@rneui/themed";
import PropTypes from "prop-types";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import { STRINGS } from "@common";
import createStyles from "./screens/styles";

// Renders nothing until a parent turns Kids Mode on, so the home header is unchanged by default.
const KidsModeEntry = ({ navigate }) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const enabled = useSelector((state) => state.kidsMode?.enabled);
  if (!enabled) return null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={STRINGS.KIDS_MODE}
      onPress={() => navigate("KidsHome")}
      style={({ pressed }) => [styles.entry, pressed && styles.buttonFaded]}
    >
      <Icon
        name="account-child-outline"
        type="material-community"
        size={30}
        color={theme.staticColors.WHITE_COLOR}
      />
    </Pressable>
  );
};

KidsModeEntry.propTypes = { navigate: PropTypes.func.isRequired };

export default KidsModeEntry;
