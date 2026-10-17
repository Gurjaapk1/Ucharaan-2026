import React from "react";
import { Pressable } from "react-native";
import PropTypes from "prop-types";
import useThemedStyles from "@common/hooks/useThemedStyles";
import { CustomText } from "@common";
import createStyles from "../screens/styles";

const KidsButton = ({ title, onPress, secondary, disabled }) => {
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.buttonSecondary,
        (disabled || pressed) && styles.buttonFaded,
      ]}
    >
      <CustomText style={[styles.buttonText, secondary && styles.buttonTextSecondary]}>
        {title}
      </CustomText>
    </Pressable>
  );
};

KidsButton.propTypes = {
  title: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
  secondary: PropTypes.bool,
  disabled: PropTypes.bool,
};
KidsButton.defaultProps = { secondary: false, disabled: false };

export default KidsButton;
