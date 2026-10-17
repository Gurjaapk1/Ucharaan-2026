import React from "react";
import { ScrollView, View } from "react-native";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import { STRINGS, CustomText, SafeArea, StatusBarComponent } from "@common";
import KidsButton from "../components/KidsButton";
import Stars from "../components/Stars";
import { isPauriReady, PAURI_COUNT } from "../data/japji";
import useKidsHeader from "../hooks/useKidsHeader";
import { currentStreak, dayKey, wordsToRevisit } from "../state/history";
import { bestStars } from "../state/progress";
import createStyles from "./styles";

// The child's view: stars, the practice streak and the words to practise next.
const ProgressScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const header = useKidsHeader(navigation, STRINGS.KIDS_MY_PROGRESS);
  const progress = useSelector((state) => state.kidsMode?.progress);
  const streak = currentStreak(progress, dayKey(new Date()));
  const revisit = wordsToRevisit(progress);
  const pauris = Array.from({ length: PAURI_COUNT }, (_, i) => i + 1).filter(
    (pauri) => isPauriReady(pauri) || bestStars(progress, pauri) > 0
  );

  return (
    <SafeArea backgroundColor={theme.colors.surface} edges={["left", "right", "bottom"]}>
      <StatusBarComponent backgroundColor={theme.colors.surface} />
      {header}
      <ScrollView contentContainerStyle={styles.pad}>
        <View style={styles.info}>
          <CustomText style={styles.small}>{STRINGS.KIDS_STREAK}</CustomText>
          {streak > 0 ? (
            <CustomText style={styles.heading}>{`${streak} ${streak === 1 ? STRINGS.KIDS_DAY_IN_A_ROW : STRINGS.KIDS_DAYS_IN_A_ROW}`}</CustomText>
          ) : (
            <CustomText style={styles.body}>{STRINGS.KIDS_STREAK_START}</CustomText>
          )}
        </View>

        <CustomText style={styles.heading}>{STRINGS.KIDS_STARS_BY_PAURI}</CustomText>
        {pauris.map((pauri) => (
          <View key={pauri} style={styles.row}>
            <CustomText style={[styles.body, styles.grow]}>{`${STRINGS.KIDS_PAURI} ${pauri}`}</CustomText>
            <Stars count={bestStars(progress, pauri)} />
          </View>
        ))}

        <CustomText style={styles.heading}>{STRINGS.KIDS_WORDS_TO_PRACTISE}</CustomText>
        {revisit.length === 0 && <CustomText style={styles.small}>{STRINGS.KIDS_NO_WORDS}</CustomText>}
        {revisit.map(({ pauri, words }) => (
          <View key={pauri} style={styles.info}>
            <CustomText style={styles.small}>{`${STRINGS.KIDS_PAURI} ${pauri}`}</CustomText>
            <View style={styles.line}>
              {words.map((word) => (
                <CustomText key={`${word.seq}-${word.idx}`} style={[styles.gurmukhi, styles.wordCheck]}>
                  {word.text}
                </CustomText>
              ))}
            </View>
            <KidsButton
              title={STRINGS.KIDS_PRACTISE}
              onPress={() => navigation.navigate("KidsPractice", { pauri })}
            />
          </View>
        ))}
      </ScrollView>
    </SafeArea>
  );
};

ProgressScreen.propTypes = {
  navigation: PropTypes.shape({ navigate: PropTypes.func, setOptions: PropTypes.func }).isRequired,
};

export default ProgressScreen;
