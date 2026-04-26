import { defineStore } from "pinia";

interface Customer {
  id: number;
  nombre: string;
  telefono: string;
  correo: string | null;
  notas: string | null;
  creado_en: string;
}

export const useCustomersStore = defineStore("customers", {
  state: () => ({
    customers: [] as Customer[],
  }),
  actions: {
    async fetchCustomers() {
      try {
        const response = await fetch("http://localhost:3000/api/customers");
        if (!response.ok) {
          throw new Error("Failed to fetch customers");
        }
        const data = await response.json();
        this.customers = data;
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    },
  },
});