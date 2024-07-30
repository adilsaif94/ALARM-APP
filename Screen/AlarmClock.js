import React, { useState, useEffect } from "react";
import { View, Text, Button, StyleSheet, Platform, PermissionsAndroid, Image } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import PushNotification from "react-native-push-notification";
import Sound from 'react-native-sound';

const AlarmClock = () => {
  const [alarmTime, setAlarmTime] = useState(new Date(new Date().getTime() + 60000)); // Set default alarm time 1 minute in the future
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [alarmSet, setAlarmSet] = useState(false); // Track if the alarm is set
  const [sound, setSound] = useState(null);

  const showTimePickerModal = () => {
    setShowTimePicker(true);
  };

  const hideTimePickerModal = () => {
    setShowTimePicker(false);
  };

  const handleTimeChange = (event, selectedTime) => {
    if (selectedTime) {
      setAlarmTime(selectedTime);
      setAlarmSet(true); // Mark the alarm as set
    }
    hideTimePickerModal();
  };

  useEffect(() => {
    // Load the sound
    const alarmSound = new Sound('alarm.mp3', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.log('Failed to load the sound', error);
        return;
      }
      setSound(alarmSound);
    });

    return () => {
      if (sound) {
        sound.release();
      }
    };
  }, []);

  useEffect(() => {
    const checkAlarm = setInterval(() => {
      const currentTime = new Date();
      if (
        alarmSet &&
        currentTime.getHours() === alarmTime.getHours() &&
        currentTime.getMinutes() === alarmTime.getMinutes()
      ) {
        if (sound) {
          sound.play((success) => {
            if (success) {
              console.log('Successfully finished playing');
            } else {
              console.log('Playback failed due to audio decoding errors');
            }
          });
        }
        showNotification();
        setAlarmSet(false); // Reset alarm set status
        clearInterval(checkAlarm);
      }
    }, 1000); // Check every second

    // Cleanup on component unmount
    return () => clearInterval(checkAlarm);
  }, [alarmTime, alarmSet, sound]);

  const showNotification = () => {
    console.log("Showing notification");
    PushNotification.localNotification({
      channelId: "alarm-channel",
      title: "Alarm",
      message: "It is time!",
      playSound: false, // We are handling the sound manually
      soundName: null,
      importance: 'high',
      priority: 'high',
      actions: ['Dismiss']
    });
  };

  const requestNotificationPermission = async () => {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: "Notification Permission",
            message: "This app needs access to show notifications",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK",
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log("Notification permission granted");
        } else {
          console.log("Notification permission denied");
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    PushNotification.configure({
      onNotification: function (notification) {
        console.log("NOTIFICATION:", notification);
        if (notification.action === 'Dismiss' && sound) {
          sound.stop(() => {
            console.log('Sound stopped');
          });
        }
      },
      requestPermissions: Platform.OS === 'ios',
    });

    PushNotification.createChannel(
      {
        channelId: "alarm-channel",
        channelName: "Alarm Channel",
        channelDescription: "A channel to categorize your alarm notifications",
        playSound: false,
        soundName: null,
        importance: 4,
        vibrate: true,
      },
      (created) => {
        console.log(`createChannel returned '${created}'`);
      }
    );
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appName}>AlarmClock</Text>
      </View>

      <View >
        <Image source={require('../assets/imgs/clock.png')} style={styles.image} />
      </View>

      <View style={styles.clockContainer}>
        <Text style={styles.clockText}>
          {alarmTime.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>

      {showTimePicker && (
        <DateTimePicker
          value={alarmTime}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
          style={styles.timePicker}
        />
      )}

      <Button
        title="Set Alarm"
        onPress={showTimePickerModal}
        color="#3498db"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#ecf0f1",
  },
  header: {
    marginBottom: 20,
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2c3e50",
    marginTop: 10
  },
  image: {
    width: 200,
    height: 200,
    marginTop: '20%'
  },
  clockContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    marginTop: '20%'
  },
  clockText: {
    fontSize: 50,
    marginRight: 10,
    color: "#2c3e50",
  },
  timePicker: {
    width: '100%',
    backgroundColor: '#fff',
  },
  footerText: {
    marginTop: 20,
    fontSize: 16,
    color: "#7f8c8d",
  },
});

export default AlarmClock;
