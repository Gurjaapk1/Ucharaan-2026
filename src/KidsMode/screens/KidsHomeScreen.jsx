import React from "react";
import { View } from "react-native";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import { STRINGS, CustomText, SafeArea, StatusBarComponent } from "@common";
import KidsButton from "../components/KidsButton";
import useKidsHeader from "../hooks/useKidsHeader";
import { totalCoins, totalStars } from "../state/progress";
import createStyles from "./styles";

const KidsHomeScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const header = useKidsHeader(navigation, STRINGS.KIDS_MODE);
  const progress = useSelector((state) => state.kidsMode?.progress);

  return (
    <SafeArea backgroundColor={theme.colors.surface}>
      <StatusBarComponent backgroundColor={theme.colors.surface} />
      {header}
      <View style={styles.pad}>
        <CustomText style={styles.heading}>{STRINGS.KIDS_HOME_HEADING}</CustomText>
        <CustomText style={styles.small}>{STRINGS.KIDS_HOME_SUBTITLE}</CustomText>
        <CustomText style={styles.body}>
          {`${totalStars(progress)} ${STRINGS.KIDS_STARS} · ${totalCoins(progress)} ${
            STRINGS.KIDS_COINS
          }`}
        </CustomText>
        <KidsButton
          title={STRINGS.KIDS_OPEN_JOURNEY}
          onPress={() => navigation.navigate("KidsJourney")}
        />
      </View>
    </SafeArea>
  );
};

KidsHomeScreen.propTypes = {
  navigation: PropTypes.shape({ navigate: PropTypes.func, setOptions: PropTypes.func }).isRequired,
};

export default KidsHomeScreen;
