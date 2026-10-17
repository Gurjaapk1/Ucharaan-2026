import React from "react";
import { View } from "react-native";
import PropTypes from "prop-types";
import useThemedStyles from "@common/hooks/useThemedStyles";
import { CustomText, STRINGS } from "@common";
import createStyles from "../screens/styles";

const Stars = ({ count, large }) => {
  const styles = useThemedStyles(createStyles);
  return (
    <View accessible accessibilityLabel={`${count} ${STRINGS.KIDS_OF_THREE_STARS}`} style={styles.stars}>
      {[1, 2, 3].map((n) => (
        <CustomText
          key={n}
          style={[large ? styles.starLarge : styles.star, n <= count ? styles.starOn : styles.starOff]}
        >
          ★
        </CustomText>
      ))}
    </View>
  );
};

Stars.propTypes = { count: PropTypes.number.isRequired, large: PropTypes.bool };
Stars.defaultProps = { large: false };

export default Stars;
