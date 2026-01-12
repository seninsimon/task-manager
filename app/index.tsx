import { useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput , FlatList } from "react-native";

export default function HomeScreen() {
  const [task, setTask] = useState<string>("");
  const [tasks, setTasks] = useState<{ id: string; title: string }[]>([]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Task Manager</Text>
      </View>

      <View style={styles.content}>
        <TextInput
          style={styles.input}
          placeholder="Enter a new task"
          value={task}
          onChangeText={setTask}
        />

        <Pressable
          style={styles.button}
          onPress={() => {
            if (!task.trim()) return;

            setTasks((prev) => [
              ...prev,
              { id: Date.now().toString(), title: task },
            ]);

            setTask("");
          }}
        >
          <Text style={styles.buttonText}>Add Task</Text>
        </Pressable>
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ marginTop: 24, width: "100%" }}
          renderItem={({ item }) => (
            <View style={styles.taskItem}>
              <Text style={styles.taskText}>{item.title}</Text>
            </View>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  taskItem: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  taskText: {
    fontSize: 16,
    color: "#1F2937",
  },

  input: {
    width: "90%",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
    marginBottom: 16,
  },

  button: {
    width: "90%",
    backgroundColor: "#1F2937",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },

  header: {
    height: 60,
    backgroundColor: "#fcf9f9",
    justifyContent: "center",
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },

  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  subtitle: {
    fontSize: 16,
    color: "#6B7280",
  },
});
