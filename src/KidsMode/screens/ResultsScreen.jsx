import React from "react";
import { ScrollView, View } from "react-native";
import PropTypes from "prop-types";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import { STRINGS, CustomText, SafeArea, StatusBarComponent } from "@common";
import KidsButton from "../components/KidsButton";
import Stars from "../components/Stars";
import useKidsAudio from "../hooks/useKidsAudio";
import useKidsHeader from "../hooks/useKidsHeader";
import createStyles from "./styles";

const ResultsScreen = ({ navigation, route }) => {
  const { pauri, result, award } = route.params;
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const header = useKidsHeader(navigation, `${STRINGS.KIDS_PAURI} ${pauri}`);
  const { play } = useKidsAudio();
  const words = result.lines.flatMap((line) => line.words);
  const toCheck = words.filter((word) => word.state === "check").length;
  const focus = result.focus && result.lines[result.focus.line]?.words[result.focus.word];
  const wordStyle = { check: styles.wordCheck, unclear: styles.wordUnclear };

  return (
    <SafeArea backgroundColor={theme.colors.surface} edges={["left", "right", "bottom"]}>
      <StatusBarComponent backgroundColor={theme.colors.surface} />
      {header}
      <ScrollView contentContainerStyle={styles.pad}>
        <CustomText style={styles.heading}>{STRINGS.KIDS_CHALLENGE_COMPLETE}</CustomText>
        <View style={styles.row}>
          <View style={styles.grow}>
            <CustomText style={styles.score}>{`${result.score}%`}</CustomText>
            <CustomText style={styles.small}>{STRINGS.KIDS_SHARE_LIKE}</CustomText>
          </View>
          <Stars count={result.stars} large />
        </View>
        <View style={styles.info}>
          <CustomText style={styles.heading}>
            {award ? `+${award} ${STRINGS.KIDS_COINS}` : STRINGS.KIDS_BEST_KEPT}
          </CustomText>
          <CustomText style={styles.small}>
            {award ? STRINGS.KIDS_COINS_PER_STAR : STRINGS.KIDS_IMPROVE}
          </CustomText>
        </View>

        <CustomText style={styles.heading}>{STRINGS.KIDS_WORD_BY_WORD}</CustomText>
        <View style={styles.row}>
          <CustomText style={styles.body}>{STRINGS.KIDS_LIKE}</CustomText>
          <CustomText style={[styles.body, styles.wordCheck]}>{STRINGS.KIDS_CHECK}</CustomText>
          <CustomText style={[styles.body, styles.wordUnclear]}>{STRINGS.KIDS_UNCLEAR_WORD}</CustomText>
        </View>
        <CustomText style={styles.small}>{`${toCheck} ${STRINGS.KIDS_WORDS_TO_CHECK}`}</CustomText>
        <CustomText style={styles.small}>{STRINGS.KIDS_NOT_DETECTED}</CustomText>

        {focus && (
          <View style={[styles.info, styles.retryBox]}>
            <CustomText style={styles.small}>{STRINGS.KIDS_PRACTISE_WORD}</CustomText>
            <CustomText style={[styles.gurmukhi, styles.retryText]}>{focus.text}</CustomText>
            <CustomText style={styles.small}>
              {`${STRINGS.KIDS_LINE} ${result.focus.line + 1}`}
            </CustomText>
            <KidsButton
              title={STRINGS.KIDS_PRACTISE_WORD}
              onPress={() => navigation.navigate("KidsPractice", { pauri })}
            />
            {focus.clip && (
              <KidsButton
                secondary
                title={`${STRINGS.KIDS_HEAR_RECITER} ${focus.text}`}
                onPress={() => play({ id: focus.clip, url: focus.clip, title: focus.text })}
              />
            )}
          </View>
        )}

        {result.lines.map((line, index) => (
          <View key={line.seq}>
            <View style={styles.row}>
              <CustomText style={[styles.small, styles.grow]}>
                {`${STRINGS.KIDS_LINE} ${index + 1}`}
              </CustomText>
              <Stars count={line.stars} />
              <CustomText style={styles.small}>{`${line.score}%`}</CustomText>
            </View>
            <View style={styles.line}>
              {line.words.map((word, w) => (
                <CustomText
                  // Words repeat within a line, so position is the only stable key.
                  // eslint-disable-next-line react/no-array-index-key
                  key={w}
                  style={[styles.gurmukhi, wordStyle[word.state]]}
                >
                  {word.text}
                </CustomText>
              ))}
            </View>
          </View>
        ))}

        <KidsButton
          title={STRINGS.KIDS_TRY_AGAIN}
          onPress={() => navigation.replace("KidsChallenge", { pauri })}
        />
        <KidsButton
          secondary
          title={STRINGS.KIDS_BACK_TO_JOURNEY}
          onPress={() => navigation.navigate("KidsJourney")}
        />
      </ScrollView>
    </SafeArea>
  );
};

const wordShape = PropTypes.shape({
  text: PropTypes.string,
  state: PropTypes.oneOf(["like", "check", "unclear"]),
  clip: PropTypes.string,
});

ResultsScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    replace: PropTypes.func,
    setOptions: PropTypes.func,
  }).isRequired,
  route: PropTypes.shape({
    params: PropTypes.shape({
      pauri: PropTypes.number,
      award: PropTypes.number,
      result: PropTypes.shape({
        score: PropTypes.number,
        stars: PropTypes.number,
        focus: PropTypes.shape({ line: PropTypes.number, word: PropTypes.number }),
        lines: PropTypes.arrayOf(
          PropTypes.shape({
            seq: PropTypes.number,
            score: PropTypes.number,
            stars: PropTypes.number,
            words: PropTypes.arrayOf(wordShape),
          })
        ),
      }),
    }),
  }).isRequired,
};

export default ResultsScreen;
