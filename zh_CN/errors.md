# 常见错误
### EMQ X 无法连接 MySQL 8.0

**标签:** [*MySQL*](tags.md#mysql)  [*认证*](tags.md#认证)


不同于以往版本，MySQL 8.0 对账号密码配置默认使用`caching_sha2_password`插件，需要将密码插件改成`mysql_native_password`

  + 修改 `mysql.user` 表

    ```
    ## 切换到 mysql 数据库
    mysql> use mysql;

    ## 查看 user 表

    mysql> select user, host, plugin from user;
    +------------------+-----------+-----------------------+
    | user             | host      | plugin                |
    +------------------+-----------+-----------------------+
    | root             | %         | caching_sha2_password |
    | mysql.infoschema | localhost | caching_sha2_password |
    | mysql.session    | localhost | caching_sha2_password |
    | mysql.sys        | localhost | caching_sha2_password |
    | root             | localhost | caching_sha2_password |
    +------------------+-----------+-----------------------+

    ## 修改密码插件
    mysql> ALTER USER 'your_username'@'your_host' IDENTIFIED WITH mysql_native_password BY 'your_password';
    Query OK, 0 rows affected (0.01 sec)

    ## 刷新
    mysql> FLUSH PRIVILEGES;
    Query OK, 0 rows affected (0.00 sec)
    ```

  + 修改 `my.conf`
    
    在 `my.cnf` 配置文件里面的 [mysqld] 下面加一行
    ```
    default_authentication_plugin=mysql_native_password
    ```

  + 重启 MySQL 即可

### macOS 上 crypto 启动失败

**标签:** [*macOS*](tags.md#macOS)  [*无法启动*](tags.md#无法启动)

由于 OpenSSL 安装目录不正确可能会导致emqx 在 macOS 无法启动。

    + 错误日志:

    ```
    Exec: /tmp/emqx/erts-10.6.2/bin/erlexec -boot /tmp/emqx/releases/v4.0.0/emqx -mode embedded -boot_var ERTS_LIB_DIR /tmp/emqx/erts-10.6.2/../lib -mnesia dir "/tmp/emqx/data/mnesia/emqx@127.0.0.1" -config /tmp/emqx/data/configs/app.2020.01.17.13.08.01.config -args_file /tmp/emqx/data/configs/vm.2020.01.17.13.08.01.args -vm_args /tmp/emqx/data/configs/vm.2020.01.17.13.08.01.args -- console
Root: /tmp/emqx
/tmp/emqx
    Erlang/OTP 22 [erts-10.6.2] [source] [64-bit] [smp:4:4] [ds:4:4:10] [async-threads:4] [hipe] [dtrace]

    {"Kernel pid terminated",application_controller,"{application_start_failure,kernel,{{shutdown,{failed_to_start_child,kernel_safe_sup,{on_load_function_failed,crypto}}},{kernel,start,[normal,[]]}}}"}
    Kernel pid terminated (application_controller) ({application_start_failure,kernel,{{shutdown,{failed_to_start_child,kernel_safe_sup,{on_load_function_failed,crypto}}},{kernel,start,[normal,[]]}}})

    Crash dump is being written to: log/crash.dump...done
    ```

    + 如何解决:

    首先，确认发布包当前依赖的 OpenSSL 路径:

    ```
    $ otool -L lib/crypto-*/priv/lib/crypto.so
    lib/crypto-4.6/priv/lib/crypto.so:
        /usr/local/opt/openssl@1.1/lib/libcrypto.1.1.dylib (compatibility version 1.1.0, current version 1.1.0)
        /usr/lib/libSystem.B.dylib (compatibility version 1.0.0, current version 1252.250.1)
    ```

    其中 `/usr/local/opt/openssl@1.1/lib/libcrypto.1.1.dylib` 为 emqx 依赖的 OpenSSL 动态库路径。**由于该路径文件不存在，导致 emqx 启动失败**。

    在emqx 4.0.1 以上执行以下命令安装 openssl 即可:

    ```
    brew install openssl@1.1
    ```

    如果为其他版本，则需要手动确保 `otool -L lib/crypto-*/priv/lib/crypto.so` 打印的 `openssl` 依赖的路径存在即可。

