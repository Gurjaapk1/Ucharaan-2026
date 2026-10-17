import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import { STRINGS, CustomText, SafeArea, StatusBarComponent } from "@common";
import KidsButton from "../components/KidsButton";
import {
  activeWord,
  lineTimings,
  RECITERS,
  reciterOrDefault,
  reciterTrack,
} from "../data/reciters";
import useKidsAudio from "../hooks/useKidsAudio";
import useKidsHeader from "../hooks/useKidsHeader";
import usePauriLines from "../hooks/usePauriLines";
import { setKidsReciter } from "../state/actions";
import createStyles from "./styles";

const PracticeScreen = ({ navigation, route }) => {
  const { pauri } = route.params;
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const dispatch = useDispatch();
  const header = useKidsHeader(navigation, `${STRINGS.KIDS_PAURI} ${pauri}`);
  const isTransliteration = useSelector((state) => state.isTransliteration);
  const isAudioOn = useSelector((state) => state.isAudioFeatureEnabled ?? true);
  const reciter = reciterOrDefault(useSelector((state) => state.kidsMode?.reciter));
  const lines = usePauriLines(pauri);
  const { playing, position, play, stop } = useKidsAudio();

  const timings = lineTimings(
    reciter,
    lines.map((line) => line.seq)
  );
  const wordCounts = lines.map((line) => line.words.length);
  const current = playing ? activeWord(timings, wordCounts, position) : null;

  const listen = () => {
    if (playing) stop();
    else play(reciterTrack(reciter), timings[0].start, timings[timings.length - 1].end);
  };
  const chooseReciter = (id) => {
    stop();
    dispatch(setKidsReciter(id));
  };

  return (
    <SafeArea backgroundColor={theme.colors.surface} edges={["left", "right", "bottom"]}>
      <StatusBarComponent backgroundColor={theme.colors.surface} />
      {header}
      <ScrollView contentContainerStyle={styles.pad}>
        <CustomText style={styles.heading}>{STRINGS.KIDS_LISTEN_AND_REPEAT}</CustomText>
        {lines.map((line, l) => (
          <View key={line.seq}>
            <View style={styles.line}>
              {line.words.map((word, w) => (
                <View
                  // Words repeat within a line, so position is the only stable key.
                  // eslint-disable-next-line react/no-array-index-key
                  key={w}
                  style={[
                    styles.word,
                    current?.line === l && current?.word === w && styles.wordActive,
                  ]}
                >
                  <CustomText style={styles.gurmukhi}>{word.text}</CustomText>
                  {isTransliteration && word.translit !== null && (
                    <CustomText style={styles.translit}>{word.translit}</CustomText>
                  )}
                </View>
              ))}
            </View>
            {isTransliteration && line.words[0]?.translit === null && (
              <CustomText style={styles.translit}>{line.translit}</CustomText>
            )}
          </View>
        ))}
      </ScrollView>
      {isAudioOn && (
        <View style={styles.controls}>
          <View style={styles.chips}>
            {Object.keys(RECITERS).map((id) => (
              <Pressable
                key={id}
                accessibilityRole="button"
                accessibilityState={{ selected: id === reciter }}
                onPress={() => chooseReciter(id)}
                style={[styles.chip, id === reciter && styles.chipSelected]}
              >
                <CustomText style={styles.body}>{RECITERS[id].name}</CustomText>
              </Pressable>
            ))}
          </View>
          <KidsButton
            title={playing ? STRINGS.KIDS_PAUSE : STRINGS.KIDS_LISTEN}
            onPress={listen}
            disabled={!lines.length}
          />
        </View>
      )}
    </SafeArea>
  );
};

PracticeScreen.propTypes = {
  navigation: PropTypes.shape({ navigate: PropTypes.func, setOptions: PropTypes.func }).isRequired,
  route: PropTypes.shape({ params: PropTypes.shape({ pauri: PropTypes.number }) }).isRequired,
};

export default PracticeScreen;
