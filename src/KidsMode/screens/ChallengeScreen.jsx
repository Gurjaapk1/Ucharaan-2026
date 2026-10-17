import React, { useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import { STRINGS, CustomText, SafeArea, StatusBarComponent, logError } from "@common";
import KidsButton from "../components/KidsButton";
import { PAURI_SEQS } from "../data/japji";
import { reciterOrDefault } from "../data/reciters";
import useKidsHeader from "../hooks/useKidsHeader";
import usePauriLines from "../hooks/usePauriLines";
import useRecorder from "../hooks/useRecorder";
import { fetchManifest, scoreRecording } from "../scoring/client";
import { toReview } from "../scoring/review";
import { recordKidsResult } from "../state/actions";
import { bestStars, coinAward } from "../state/progress";
import createStyles from "./styles";

// The service aligns a complete recitation, so the whole pauri is one recording sent on stop.
const ChallengeScreen = ({ navigation, route }) => {
  const { pauri } = route.params;
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const dispatch = useDispatch();
  const header = useKidsHeader(navigation, `${STRINGS.KIDS_PAURI} ${pauri}`);
  const optedIn = useSelector((state) => state.kidsMode?.scoringOptIn);
  const reciter = reciterOrDefault(useSelector((state) => state.kidsMode?.reciter));
  const best = useSelector((state) => bestStars(state.kidsMode?.progress, pauri));
  const lines = usePauriLines(pauri);
  const { recording, start, stop } = useRecorder();
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState(optedIn ? "" : STRINGS.KIDS_TURN_ON_CHECKING);

  const begin = async () => {
    setMessage("");
    try {
      if (!(await start(`pauri-${pauri}`))) setMessage(STRINGS.KIDS_MIC_NEEDED);
    } catch (error) {
      logError(error);
      setMessage(STRINGS.KIDS_MIC_NEEDED);
    }
  };

  const finish = async () => {
    setChecking(true);
    try {
      const uri = await stop();
      // Scoring works without the manifest; only clips and the service's star bands are lost.
      const [manifest, response] = await Promise.all([
        fetchManifest().catch(() => null),
        scoreRecording(uri, { reciter, seqs: PAURI_SEQS[pauri], optedIn }),
      ]);
      if (response.status !== "ok") {
        // An unclear recording earns nothing; the child simply tries again.
        setMessage(
          response.status === "opted_out" ? STRINGS.KIDS_TURN_ON_CHECKING : STRINGS.KIDS_UNCLEAR
        );
        return;
      }
      const result = toReview(lines, response, manifest, reciter);
      dispatch(recordKidsResult(pauri, result.stars));
      navigation.replace("KidsResults", { pauri, result, award: coinAward(best, result.stars) });
    } catch (error) {
      logError(error);
      setMessage(STRINGS.KIDS_CHECK_FAILED);
    } finally {
      setChecking(false);
    }
  };

  const renderAction = () => {
    if (!optedIn) return null;
    if (checking) {
      return (
        <View accessibilityLiveRegion="polite" style={styles.center}>
          <ActivityIndicator color={theme.colors.primary} />
          <CustomText style={styles.heading}>{STRINGS.KIDS_CHECKING}</CustomText>
          <CustomText style={styles.small}>{STRINGS.KIDS_CHECKING_WAIT}</CustomText>
        </View>
      );
    }
    if (recording) {
      return (
        <>
          <KidsButton title={STRINGS.KIDS_FINISH} onPress={finish} />
          <CustomText style={styles.small}>{STRINGS.KIDS_RECORDING}</CustomText>
        </>
      );
    }
    return (
      <>
        <KidsButton
          title={message ? STRINGS.KIDS_TRY_AGAIN : STRINGS.KIDS_BEGIN}
          onPress={begin}
          disabled={!lines.length}
        />
        <CustomText style={styles.small}>{STRINGS.KIDS_SENT_NOTE}</CustomText>
      </>
    );
  };

  return (
    <SafeArea backgroundColor={theme.colors.surface} edges={["left", "right", "bottom"]}>
      <StatusBarComponent backgroundColor={theme.colors.surface} />
      {header}
      <ScrollView contentContainerStyle={styles.pad}>
        <CustomText style={styles.heading}>{`${STRINGS.KIDS_RECITE_PAURI} ${pauri}`}</CustomText>
        <CustomText style={styles.body}>{STRINGS.KIDS_RECITE_HINT}</CustomText>
        {lines.map((line) => (
          <CustomText key={line.seq} style={styles.gurmukhi}>
            {line.words.map((word) => word.text).join(" ")}
          </CustomText>
        ))}
        {message !== "" && (
          <View accessibilityLiveRegion="polite" style={[styles.info, styles.retryBox]}>
            <CustomText style={[styles.body, styles.retryText]}>{message}</CustomText>
          </View>
        )}
        {renderAction()}
        {!recording && !checking && (
          <KidsButton
            secondary
            title={STRINGS.KIDS_PRACTICE_FIRST}
            onPress={() => navigation.navigate("KidsPractice", { pauri })}
          />
        )}
      </ScrollView>
    </SafeArea>
  );
};

ChallengeScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    replace: PropTypes.func,
    setOptions: PropTypes.func,
  }).isRequired,
  route: PropTypes.shape({ params: PropTypes.shape({ pauri: PropTypes.number }) }).isRequired,
};

export default ChallengeScreen;
