import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";
import {
  FullServerResponseSchema,
  type PieData,
  type StockTable,
  type Message,
  AlertItem,
  NewsItem,
  UploadBatch,
} from "@/types";

interface WealthState {
  pieDataSets: PieData[];
  tableDataArray: StockTable[];
  messages: Message[];
  chatInput: string;
  downloadURL: string;
  task2ID: string;
  msgLoad: boolean;
  currClient: string;
  alerts: AlertItem[];
  news: NewsItem[];
  uploadBatches: UploadBatch[];

  addUploadBatch: (batch: UploadBatch) => void;
  setAlerts: (data: AlertItem[]) => void;
  setNews: (data: NewsItem[]) => void;
  setCurrClient: (client: string) => void;
  setPieDataSets: (data: PieData[]) => void;
  setTableDataArray: (data: StockTable[]) => void;
  setChatInput: (input: string) => void;
  setTask2ID: (input: string) => void;
  setDownloadURL: (input: string) => void;
  handleSendMessage: () => void;
  clearStorage: () => void;
}

export const useWealthStore = create<WealthState>()(
  persist(
    (set, get) => ({
      pieDataSets: [],
      tableDataArray: [],
      messages: [],
      chatInput: "",
      downloadURL: "",
      task2ID: "",
      msgLoad: false,
      currClient: "Overall",
      alerts: [],
      news: [],
      uploadBatches: [],

      addUploadBatch: (batch) =>
        set((state) => ({
          uploadBatches: [...state.uploadBatches, batch],
        })),
      setAlerts: (data) => set({ alerts: data }),
      setNews: (data) => set({ news: data }),
      setCurrClient: (client) => set({ currClient: client }),
      setPieDataSets: (data) => set({ pieDataSets: data }),
      setTableDataArray: (data) => set({ tableDataArray: data }),
      setChatInput: (input) => set({ chatInput: input }),
      setTask2ID: (input) => set({ task2ID: input }),
      setDownloadURL: (input) => set({ downloadURL: input }),

      handleSendMessage: async () => {
        set({ msgLoad: true });
        const input = get().chatInput.trim();
        if (!input) return;

        const userMessage: Message = {
          content: input,
          isUser: true,
          timestamp: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }).toUpperCase(),
        };

        set({
          messages: [...get().messages, userMessage],
          chatInput: "",
        });

        try {
          const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/bankdemo/msg`, { user_input: input });
          const aiResponse: Message = {
            content: response.data.result.response || "server error",
            isUser: false,
            timestamp: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }).toUpperCase(),
          };

          set({
            messages: [...get().messages, aiResponse],
            msgLoad: false,
          });
        } catch (error) {
          console.error("Error sending message:", error);
          set({
            messages: [...get().messages, { content: "Error sending message", isUser: false }],
            msgLoad: false,
          });
        }
      },

      clearStorage: () =>
        set({
          pieDataSets: [],
          tableDataArray: [],
          messages: [],
          chatInput: "",
          downloadURL: "",
          task2ID: "",
          msgLoad: false,
          alerts: [],
          news: [],
        }),
    }),
    { name: "wealth-storage", version: 1 }
  )
);
