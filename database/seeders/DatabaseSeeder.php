<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Service;
use App\Models\Schedule;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = Tenant::firstOrCreate(
            ['slug' => 'ava-clinic-odontologia'],
            [
                'name' => 'AVA Clinic Odontología',
                'phone' => '+595992814554',
                'whatsapp' => '+595992814554',
                'address' => 'J5H6+HRX, Encarnación 070125',
                'city' => 'Encarnación',
                'country' => 'Paraguay',
                'is_active' => true,
            ]
        );

        $user = User::firstOrCreate(
            ['email' => 'ava@avaclinic.com'], // ← cambiar por el email real
            [
                'tenant_id' => $tenant->id,
                'name' => 'AVA Clinic Odontología',
                'password' => bcrypt('123456'), // ← cambiar después del primer login
                'role' => 'owner',
                'is_active' => true,
            ]
        );

        Service::firstOrCreate(
            ['tenant_id' => $tenant->id, 'name' => 'Consulta Odontológica'],
            [
                'description' => 'Evaluación general y diagnóstico. El precio final depende del tipo de tratamiento indicado.',
                'duration_minutes' => 60,
                'price' => 0,
                'is_active' => true,
                'sort_order' => 1,
            ]
        );

        $horarios = [
            0 => [],                          // domingo: cerrado
            1 => [['08:00', '18:00']],        // lunes
            2 => [['08:00', '18:00']],        // martes
            3 => [['08:00', '18:00']],        // miércoles
            4 => [['08:00', '18:00']],        // jueves
            5 => [['08:00', '18:00']],        // viernes
            6 => [['09:00', '17:30']],        // sábado
        ];

        foreach ($horarios as $day => $rangos) {
            foreach ($rangos as [$apertura, $cierre]) {
                Schedule::firstOrCreate(
                    [
                        'tenant_id' => $tenant->id,
                        'user_id' => $user->id,
                        'day_of_week' => $day,
                        'opens_at' => $apertura . ':00',
                    ],
                    [
                        'closes_at' => $cierre . ':00',
                        'is_active' => true,
                    ]
                );
            }
        }

        echo PHP_EOL . "======================================" . PHP_EOL;
        echo " AVA Clinic Odontología inicializado" . PHP_EOL;
        echo "======================================" . PHP_EOL;
        echo "Tenant ID: {$tenant->id}" . PHP_EOL;
        echo "User (doctor) ID: {$user->id}" . PHP_EOL;
        foreach (Service::where('tenant_id', $tenant->id)->get(['id','name']) as $s) {
            echo "Servicio: {$s->id} - {$s->name}" . PHP_EOL;
        }
        echo "======================================" . PHP_EOL;
    }
}
