import React, { useState } from "react";
import { ScrollView, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import { STRINGS, CustomText, SafeArea, StatusBarComponent } from "@common";
import KidsButton from "../components/KidsButton";
import useKidsAudio from "../hooks/useKidsAudio";
import useKidsHeader from "../hooks/useKidsHeader";
import {
  currentStreak,
  dayKey,
  improvements,
  isJapjiComplete,
  pauriCounts,
  practiceDays,
  wordsToRevisit,
} from "../state/history";
import { deleteKidsRecording, recordingUrl } from "../state/progressActions";
import createStyles from "./styles";

const RECENT_DAYS = 7;

const timeLabel = (iso) => {
  const date = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${dayKey(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// Descriptive only: practice, not mastery, and no comparison with other children.
const ParentSummaryScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const dispatch = useDispatch();
  const header = useKidsHeader(navigation, STRINGS.KIDS_PARENT_SUMMARY);
  const progress = useSelector((state) => state.kidsMode?.progress);
  const recordings = useSelector((state) => state.kidsMode?.recordings) ?? [];
  const { play } = useKidsAudio();
  const [failed, setFailed] = useState(false);

  const days = practiceDays(progress);
  const { practised, completed } = pauriCounts(progress);
  const revisit = wordsToRevisit(progress);
  const improved = improvements(progress);

  const remove = async (path) => setFailed(!(await dispatch(deleteKidsRecording(path))));

  const stat = (label, value) => (
    <View style={styles.row}>
      <CustomText style={[styles.body, styles.grow]}>{label}</CustomText>
      <CustomText style={styles.heading}>{String(value)}</CustomText>
    </View>
  );

  return (
    <SafeArea backgroundColor={theme.colors.surface} edges={["left", "right", "bottom"]}>
      <StatusBarComponent backgroundColor={theme.colors.surface} />
      {header}
      <ScrollView contentContainerStyle={styles.pad}>
        {stat(STRINGS.KIDS_PRACTICE_DAYS, days.length)}
        {stat(STRINGS.KIDS_STREAK, currentStreak(progress, dayKey(new Date())))}
        {days.length > 0 && (
          <CustomText style={styles.small}>
            {`${STRINGS.KIDS_RECENT_DAYS}: ${days.slice(-RECENT_DAYS).reverse().join(", ")}`}
          </CustomText>
        )}

        {stat(STRINGS.KIDS_PAURIS_PRACTISED, practised)}
        {stat(STRINGS.KIDS_PAURIS_WITH_STAR, completed)}
        {stat(STRINGS.KIDS_BANIS_COMPLETED, isJapjiComplete(progress) ? 1 : 0)}
        <CustomText style={styles.small}>{STRINGS.KIDS_BANI_NOTE}</CustomText>

        <CustomText style={styles.heading}>{STRINGS.KIDS_WORDS_NEEDING_REVIEW}</CustomText>
        {revisit.length === 0 && (
          <CustomText style={styles.small}>{STRINGS.KIDS_NO_REVIEW_WORDS}</CustomText>
        )}
        {revisit.map(({ pauri, words }) => (
          <View key={pauri}>
            <CustomText style={styles.small}>{`${STRINGS.KIDS_PAURI} ${pauri}`}</CustomText>
            <View style={styles.line}>
              {words.map((word) => (
                <CustomText key={`${word.seq}-${word.idx}`} style={styles.gurmukhi}>
                  {word.text}
                </CustomText>
              ))}
            </View>
          </View>
        ))}

        <CustomText style={styles.heading}>{STRINGS.KIDS_IMPROVEMENTS}</CustomText>
        {improved.length === 0 ? (
          <CustomText style={styles.small}>{STRINGS.KIDS_NO_IMPROVEMENTS}</CustomText>
        ) : (
          improved.map(({ pauri, from, to, attempts }) => (
            <CustomText key={pauri} style={styles.body}>
              {`${STRINGS.KIDS_PAURI} ${pauri}: ${from} → ${to} ${STRINGS.KIDS_STARS}, ${attempts} ${STRINGS.KIDS_CHECKED_ATTEMPTS}`}
            </CustomText>
          ))
        )}
        <CustomText style={styles.small}>{STRINGS.KIDS_IMPROVEMENT_NOTE}</CustomText>

        <CustomText style={styles.heading}>{STRINGS.KIDS_RECORDINGS}</CustomText>
        <View style={styles.info}>
          <CustomText style={styles.body}>{STRINGS.KIDS_RECORDINGS_PRIVACY}</CustomText>
        </View>
        {failed && (
          <View accessibilityLiveRegion="polite" style={[styles.info, styles.retryBox]}>
            <CustomText style={[styles.body, styles.retryText]}>
              {STRINGS.KIDS_DELETE_FAILED}
            </CustomText>
          </View>
        )}
        {recordings.length === 0 && (
          <CustomText style={styles.small}>{STRINGS.KIDS_NO_RECORDINGS}</CustomText>
        )}
        {recordings
          .slice()
          .reverse()
          .map(({ path, pauri, date }) => {
            const title = `${STRINGS.KIDS_PAURI} ${pauri} · ${timeLabel(date)}`;
            return (
              <View key={path} style={styles.row}>
                <CustomText style={[styles.body, styles.grow]}>{title}</CustomText>
                <KidsButton
                  secondary
                  title={STRINGS.KIDS_PLAY}
                  onPress={() => play({ id: path, url: recordingUrl(path), title })}
                />
                <KidsButton secondary title={STRINGS.KIDS_DELETE} onPress={() => remove(path)} />
              </View>
            );
          })}
      </ScrollView>
    </SafeArea>
  );
};

ParentSummaryScreen.propTypes = {
  navigation: PropTypes.shape({ navigate: PropTypes.func, setOptions: PropTypes.func }).isRequired,
};

export default ParentSummaryScreen;
