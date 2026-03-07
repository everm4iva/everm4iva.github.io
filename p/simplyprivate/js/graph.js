const ctx = document.getElementById('statisticsChart').getContext('2d');
const statisticsChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['December 2023', 'January 2024', 'February 2024', 'March 2024', 'April 2024', 'May 2024', 'June 2024', 'July 2024', 'August 2024', 'September 2024', 'October 2024'],
        datasets: [
            {
                label: 'Downloads',
                data: [18, 97, 355, 439, 1633, 1203, 3062, 4238, 7206, 12797, 9722],
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.4)',
                pointBackgroundColor: 'rgba(75, 192, 192, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(75, 192, 192, 1)',
                fill: true,
                tension: 0.3
            },
            {
                label: 'Views',
                data: [69, 188, 838, 791, 3085, 5923, 5406, 9256, 17801, 23405, 22366],
                borderColor: 'rgba(153, 102, 255, 1)',
                backgroundColor: 'rgba(153, 102, 255, 0.4)',
                pointBackgroundColor: 'rgba(153, 102, 255, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(153, 102, 255, 1)',
                fill: true,
                tension: 0.3
            }
        ]
    },
    options: {
        responsive: true,
        plugins: {
            title: {
                display: true,
                text: 'Monthly Data Collection: October 2024',
                font: {
                    size: 18,
                    weight: 'bold'
                },
                padding: {
                    top: 10,
                    bottom: 30
                }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(0,0,0,0.8)',
                titleFont: {
                    size: 14
                },
                bodyFont: {
                    size: 12
                }
            },
            legend: {
                display: true,
                position: 'top',
                labels: {
                    font: {
                        size: 12
                    },
                    color: '#333'
                }
            }
        },
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
        },
        scales: {
            x: {
                display: true,
                title: {
                    display: true,
                    text: 'Month',
                    font: {
                        size: 14,
                        weight: 'bold'
                    }
                },
                ticks: {
                    color: '#555'
                }
            },
            y: {
                display: true,
                title: {
                    display: true,
                    text: 'Count',
                    font: {
                        size: 14,
                        weight: 'bold'
                    }
                },
                ticks: {
                    color: '#555',
                    callback: function (value) {
                        return value.toLocaleString();
                    }
                }
            }
        }
    }
});
