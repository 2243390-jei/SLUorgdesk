// Set current year in footer
document.addEventListener('DOMContentLoaded', () => {
  const yearSpan = document.getElementById('curYear');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  // Only initialize charts if we're on the home page (optional safety check)
  const salesCanvas = document.getElementById("sales");
  const earningCanvas = document.getElementById("earning");
  const productsCanvas = document.getElementById("products");

  if (salesCanvas || earningCanvas || productsCanvas) {
    // Global Chart.js defaults
    Chart.defaults.color = "#927685";
    Chart.defaults.borderColor = "#33202c";

    // Sales Chart - Bar
    if (salesCanvas) {
      new Chart(salesCanvas, {
        type: "bar",
        data: {
          labels: ["Jan", "Feb", "Mar", "Apr", "May", "June", "July"],
          datasets: [
            {
              label: "My Revenue",
              data: [380, 200, 500, 300, 150, 400, 100],
              backgroundColor: ["rgba(155,128,151,1)"],
              hoverBackgroundColor: "#FF90B8",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: "#927685" }
            },
            y: {
              grid: { color: "rgba(51,32,44,0.3)" },
              ticks: { color: "#927685" }
            }
          }
        },
      });
    }

    // Earning Chart - Line
    if (earningCanvas) {
      new Chart(earningCanvas, {
        type: "line",
        data: {
          labels: ["Jan", "Feb", "Mar", "Apr", "May"],
          datasets: [
            {
              label: "My Revenue",
              data: [380, 200, 500, 300, 150],
              backgroundColor: "rgba(155,128,151,0.2)",
              borderColor: "rgba(155,128,151,1)",
              borderWidth: 2,
              fill: true,
              tension: 0.4,
              hoverBackgroundColor: "#FF90B8",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: "#927685" }
            },
            y: {
              grid: { color: "rgba(51,32,44,0.3)" },
              ticks: { color: "#927685" }
            }
          }
        },
      });
    }

    // Products Chart - Doughnut
    if (productsCanvas) {
      new Chart(productsCanvas, {
        type: "doughnut",
        data: {
          labels: ["Fashion", "Gadget", "Other"],
          datasets: [
            {
              label: "My Revenue",
              data: [380, 200, 500],
              backgroundColor: [
                "rgba(155,128,151,1)",
                "rgba(254,111,162,1)",
                "rgba(244,164,111,1)",
              ],
              hoverBackgroundColor: "#FF90B8",
              borderWidth: 0,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                color: "#927685",
                padding: 20,
                usePointStyle: true,
              }
            },
          },
          cutout: '70%',
        },
      });
    }
  }
});